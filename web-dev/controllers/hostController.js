const Home = require('../models/homes');
const Order = require('../models/order');
const User = require('../models/user');
const fs = require("fs");
const path = require("path");

exports.addHome = (req, res, next) => {
  res.render('admin/edit-home', {
    editing: false,
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
  });
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === 'true';

  Home.findOne({ _id: homeId, owner: req.session.user._id })
    .then(home => { 
      if (!home) {
        console.log("Home not found or unauthorized");
        return res.redirect("/host/list-home");
      }
      res.render('admin/edit-home', {
        home: home,
        pageTitle: "Edit your Home",
        currentPage: "host-homes",
        editing: editing,
        isLoggedIn: req.session.isLoggedIn,
        user: req.session.user,
      });
    })
    .catch(err => console.log(err));
};

exports.listHome = async (req, res, next) => {
  try {
    const hostId = req.session.user._id;

    // Fetch ONLY the homes owned by this host
    const registeredHomes = await Home.find({ owner: hostId });

    res.render('admin/list-home', {
      registeredHomes: registeredHomes,
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });

  } catch (err) {
    console.log("Error loading dashboard data:", err);
    res.redirect('/');
  }
};

exports.postAddHome = (req, res, next) => {
  const { houseName, price, location, rating, description } = req.body;
      
  if (!req.file) {
    return res.status(422).send("No image provided");
  }
  const photo = `/uploads/${req.file.filename}`;

  const home = new Home({
    houseName,
    price,
    location,
    rating,
    photo,
    description,
    owner: req.session.user._id
  });

  home.save()
    .then(() => {
      console.log('Home Saved Successfully');
      res.redirect("/host/list-home");
    })
    .catch(err => console.log(err));
};
   
exports.postEditHome = (req, res, next) => {
  const { _id, houseName, price, location, rating, description } = req.body;

  Home.findOne({ _id: _id, owner: req.session.user._id })
    .then((home) => {
      if (!home) {
        return res.redirect('/host/list-home');
      }

      home.houseName = houseName;
      home.price = price;
      home.location = location;
      home.rating = rating;
      home.description = description;
      
      if (req.file) {
        home.photo = `/uploads/${req.file.filename}`;
      }    

      return home.save().then((result) => {
        console.log('Home updated', result);
        res.redirect('/host/list-home');
      });
    })
    .catch(err => console.log(err));
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;

  Home.findOne({ _id: homeId, owner: req.session.user._id })
    .then(home => {
      if (!home) {
        const error = new Error("Unauthorized deletion attempt or missing item.");
        error.statusCode = 404;
        throw error;
      }

      const filePath = path.join(__dirname, "..", home.photo);

      // 1. Delete physical file safely
      fs.unlink(filePath, err => {
        if (err) console.log("Image delete failed or file missing locally:", err);
      });

      // 2. 🔑 THE FIX: Remove this home ID from ALL users' bookings and favourites arrays
      // We also delete any orders associated with this home to prevent orphaned order documents
      return Promise.all([
        User.updateMany({}, { $pull: { bookings: homeId, favourites: homeId } }),
        Order.deleteMany({ homeId: homeId }),
        Home.findByIdAndDelete(homeId)
      ]);
    })
    .then(() => {
      console.log(`=== CASCADING DELETE === Home ${homeId} cleared from all collections.`);
      res.redirect("/host/list-home");
    })
    .catch(err => {
      console.log(err);
      res.redirect("/host/list-home");
    });
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ hostId: req.session.user._id })
      .populate('homeId')  
      .populate('guestId', 'email'); 

    // 🔑 THE FIX: Filter out any orders where the home or guest document no longer exists
    const validOrders = orders.filter(order => order.homeId && order.guestId);

    res.render('admin/orders', {
      orders: validOrders, // Pass only the clean, valid orders
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      pageTitle: "Incoming Orders"
    });
  } catch (err) {
    console.log("Error fetching orders:", err);
    res.redirect('/');
  }
};

exports.postUpdateOrderStatus = async (req, res, next) => {
  const { orderId, status } = req.body;

  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, hostId: req.session.user._id },
      { status: status },
      { new: true }
    );
    
    if (updatedOrder) {
      const targetHomeId = updatedOrder.homeId.toString();

      // Lock home if the host confirms it as Booked OR if it remains in Paid state
      if (status === 'Booked' || status === 'Paid') {
        await Home.findByIdAndUpdate(targetHomeId, { status: 'Booked' });
        console.log(`=== SYNC LOCK === Home ${targetHomeId} locked due to state: ${status}`);
      } else if (status === 'In Progress') {
        // ONLY open it back up to the public marketplace if explicitly reverted to 'In Progress'
        await Home.findByIdAndUpdate(targetHomeId, { status: 'Available' });
        console.log(`=== SYNC LOCK === Home ${targetHomeId} reset back to AVAILABLE`);
      }
    }

    res.redirect('/host/orders');
  } catch (err) {
    console.error("Error updates shifting status synchronization:", err);
    res.redirect('/host/orders');
  }
};