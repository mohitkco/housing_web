const express = require("express");
const hostRouter = express.Router();
//const path = require('path');
const hostController = require("../controllers/hostController")
//const {registeredHomes} = require('../controllers/hostController');



hostRouter.get("/add-home" ,hostController.addHome);
hostRouter.post("/add-home" ,hostController.postAddHome);
hostRouter.get("/list-home",hostController.listHome);
hostRouter.get("/edit-home/:homeId", hostController.getEditHome);
hostRouter.post("/edit-home", hostController.postEditHome);
hostRouter.post("/delete-home/:homeId",hostController.postDeleteHome);
exports.hostRouter = hostRouter ;
