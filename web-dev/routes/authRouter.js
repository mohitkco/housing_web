const express = require("express");
const authRouter = express.Router();

const authController = require('../controllers/authController');

authRouter.get('/login',authController.login);
authRouter.post('/login',authController.postlogin);
authRouter.post('/logout',authController.postlogout);
authRouter.get('/signup',authController.signup);
authRouter.post('/signup',authController.postSignup);
module.exports = authRouter;