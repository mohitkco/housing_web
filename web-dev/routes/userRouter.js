const express=require("express");
const userRouter = express.Router();
//const path = require('path');
//const {registeredHomes} = require('../controllers/hostController');
const userController = require('../controllers/userController');

userRouter.get("/",userController.user);
// Bookings page
userRouter.get("/bookings", userController.getBookings);
userRouter.post("/bookings", userController.postAddBookings);
// Favourites page
//userRouter.get("/favourites", userController.favourites);
userRouter.post('/favourites', userController.postAddFavourite);
userRouter.post('/payment/:homeId',userController.postPayment);
// Show favourites
userRouter.get('/favourites', userController.getFavourites);
userRouter.post('/favourites/delete/:homeId', userController.postRemoveFromFavourite);

userRouter.get("/book/:homeId", userController.getHomesDetails);
module.exports = userRouter;