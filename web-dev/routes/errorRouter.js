const express = require('express');

const errorRouter = express.Router();
//const path = require('path');
const errorController = require('../controllers/errorController');

errorRouter.use( errorController.error);

exports.errorRouter = errorRouter;