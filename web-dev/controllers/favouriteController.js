const Favourite = require('../models/favourite');

/**
 * Add a home to favourites
 */
exports.postAddFavourite = (req, res) => {
  const homeId = req.body.id; // or req.params.id

  Favourite.addToFavourite(homeId, () => {
    // After adding, redirect or respond
    res.redirect('/favourites');
  });
};

/**
 * Get all favourite homes
 */
exports.getFavourites = (req, res) => {
  Favourite.getFavourites((favourites) => {
    res.render('favourites', {
      pageTitle: 'Your Favourites',
      favourites: favourites,
      isLoggedIn: req.session.isLoggedIn,
    });
  });
};
