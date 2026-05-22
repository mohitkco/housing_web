const Home = require('../models/homes');
const User = require('../models/user');
const Order = require('../models/order');

exports.user = (req, res, next) => {
  Home.find().then(registeredHomes => {
    res.render('store/user', {
      registeredHomes: registeredHomes,
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getBookings = async (req, res, next) => {
  try {
    // 🛡️ ROLE GUARD: Verify logged in state and confirm account type is guest
    if (!req.session.user || req.session.user.userType !== 'guest') {
      console.log("Access Denied: Hosts or unauthenticated entities blocked from bookings collection.");
      return res.redirect('/');
    }

    // Find all orders submitted by this specific guest
    const guestOrders = await Order.find({ guestId: req.session.user._id })
      .populate('homeId'); 

    // Map the orders so they match the structure your bookings.ejs expects
    const formattedBookings = guestOrders.map(order => {
      if (!order.homeId) return null;

      return {
        _id: order.homeId._id,
        houseName: order.homeId.houseName,
        location: order.homeId.location,
        price: order.homeId.price,
        rating: order.homeId.rating,
        photo: order.homeId.photo,
        isPaid: order.status === 'Paid',
        isBooked: order.status === 'Booked'
      };
    }).filter(booking => booking !== null);

    res.render('store/bookings', {
      registeredHomes: formattedBookings,
      path: '/bookings',
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user
    });

  } catch (err) {
    console.log("Error loading bookings view:", err);
    res.redirect('/');
  }
};

exports.postAddBookings = async (req, res, next) => {
  try {
    const homeId = req.body.homeId;
    
    // 🛡️ ROLE GUARD: Prevent non-guests from creating order models
    if (!req.session || !req.session.user || req.session.user.userType !== 'guest') {
      return res.redirect('/login');
    }
    const guestId = req.session.user._id;

    const home = await Home.findById(homeId);
    if (!home) {
      console.log("Booking error: Target home listing not found.");
      return res.redirect('/');
    }

    const user = await User.findById(guestId);
    if (!user.bookings.includes(homeId)) {
      user.bookings.push(homeId);
      await user.save();
    }

    const existingOrder = await Order.findOne({ homeId: homeId, guestId: guestId });
    
    if (!existingOrder) {
      const order = new Order({
        homeId: homeId,
        guestId: guestId,
        hostId: home.owner, 
        status: 'In Progress'
      });
      await order.save();
      console.log(`=== PIPELINE SYNC === New pending order initialized for Home: ${home.houseName}`);
    }

    res.redirect('/bookings');
  } catch (err) {
    console.error("Error inside postAddBookings pipeline:", err);
    res.redirect('/');
  }
};

exports.favourites = (req, res, next) => {
  Home.find().then(registeredHomes => {
    res.render('store/favourites', {
      registeredHomes: registeredHomes,
      path: '/favourites',
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  });
};

exports.getFavourites = async (req, res, next) => {
  try {
    // 🛡️ ROLE GUARD: Stop non-guests from interacting with favourites view
    if (!req.session.user || req.session.user.userType !== 'guest') {
      return res.redirect('/');
    }

    const user = await User.findById(req.session.user._id).populate('favourites');

    res.render('store/favourites', {
      registeredHomes: user.favourites || [],
      path: '/favourites',
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user
    });

  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
};

exports.getHomesDetails = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId).then(home => {
    if (!home) {
      console.log("home not found");
      res.redirect("/user");
    } else {
      res.render('store/home-details', {
        home: home,
        isLoggedIn: req.session.isLoggedIn,
        user: req.session.user,
      });
    }
  });
};

exports.postAddFavourite = async (req, res, next) => {
  try {
    const homeId = req.body.homeId;
    
    // 🛡️ ROLE GUARD
    if (!req.session.user || req.session.user.userType !== 'guest') {
      return res.redirect('/');
    }
    
    const user = await User.findById(req.session.user._id);

    if (!user.favourites.includes(homeId)) {
      user.favourites.push(homeId);
      await user.save();
    }

    res.redirect('/favourites');
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
};

exports.postRemoveFromFavourite = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;

    // 🛡️ ROLE GUARD
    if (!req.session.user || req.session.user.userType !== 'guest') {
      return res.redirect('/');
    }

    await User.findByIdAndUpdate(req.session.user._id, {
      $pull: { favourites: homeId }
    });

    res.redirect('/favourites');
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
};

exports.postPayment = async (req, res, next) => {
  const homeId = req.params.homeId;
  const guestId = req.session.user._id;

  try {
    // 🛡️ ROLE GUARD
    if (!req.session.user || req.session.user.userType !== 'guest') {
      return res.redirect('/');
    }

    const existingOrder = await Order.findOne({ homeId: homeId, guestId: guestId });

    if (existingOrder) {
      // 1. Switch the status to 'Paid' instantly upon clicking
      existingOrder.status = 'Paid';
      await existingOrder.save();
      
      // 2. Lock home immediately so it displays as already booked on the root marketplace view
      await Home.findByIdAndUpdate(homeId, { status: 'Booked' });
      
      console.log(`=== PAYMENT RECEIVED === Order ${existingOrder._id} marked as Paid & Home locked.`);
    }

    res.redirect('/bookings'); 
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error processing payment");
  }
};