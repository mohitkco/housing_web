const Home = require('../models/homes');
// const Favourite = require('../models/favourite');
const User = require('../models/user');

exports.user = (req,res,next) => {
        Home.find().then(registeredHomes => {
         res.render('store/user',
        {registeredHomes:registeredHomes,
          isLoggedIn: req.session.isLoggedIn,
          user: req.session.user,
        })
})
}

exports.bookings = (req, res, next) => {
  res.render('store/bookings', {
    path: '/bookings',
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
  });
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

/**
 * Get all favourite homes
 */
// exports.getFavourites = (req, res) => {
//   Favourite.find()
//     .then(favourites => {
//      // const favouriteHomeIds = favourites.map(f => f.homeId.toString());
//       const favouriteHomeIds = favourites
//   .filter(f => f.homeId)       // remove bad records
//   .map(f => f.homeId.toString());


//       Home.find().then(registeredHomes => {
//         const favouriteHomes = registeredHomes.filter(home =>
//           favouriteHomeIds.includes(home._id.toString())
//         );

//         res.render('store/favourites', {
//           pageTitle: 'Your Favourites',
//           registeredHomes: favouriteHomes
//         });
//       });
//     })
//     .catch(err => console.log(err));
// };


exports.getFavourites = async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const user = await User.findById(req.session.user._id)
      .populate('favourites');

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



exports.getHomesDetails = (req,res,next) => {
    const homeId = req.params.homeId;
    console.log(homeId);
    Home.findById(homeId).then(home => {
      
        if(!home){
            console.log("home not found");
        res.redirect("/user");
        }else{
    console.log(home);
    res.render('store/home-details',{
        home:home ,
        isLoggedIn: req.session.isLoggedIn,
        user: req.session.user,
    });
        }
})

};

exports.postAddFavourite = async (req, res, next) => {
  try {
    const homeId = req.body.homeId;
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

    await User.findByIdAndUpdate(req.session.user._id, {
      $pull: { favourites: homeId }
    });

    res.redirect('/favourites');
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
};




