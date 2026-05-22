const express = require('express');
const favouriteController = require('../controllers/favouriteController');

const router = express.Router();

// Add to favourites
router.post('/favourites', favouriteController.postAddFavourite);

// Show favourites
router.get('/favourites', favouriteController.getFavourites);

module.exports = router;
