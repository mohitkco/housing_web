
const Home = require('../models/homes');
const fs = require("fs");
const path = require("path");



exports.addHome = (req,res,next) => {
  res.render('admin/edit-home',{
   editing: false,
   isLoggedIn: req.session.isLoggedIn,
   user: req.session.user,
  });
}

exports.getEditHome = (req,res,next) => {
   const homeId = req.params.homeId;
   const editing = req.query.editing === 'true';

   Home.findById(homeId).then(home => {
      
      if(!home){
         console.log("Home not found for editing");
         return res.redirect("/host/list-home")
      }
     console.log(homeId,editing,home);
  res.render('admin/edit-home',{
   home: home,
   pageTitle: "Edit your Home",
   currentPage: "host-homes",
   editing: editing,
   isLoggedIn: req.session.isLoggedIn,
   user: req.session.user,
  })
   })
}


 exports.listHome = (req,res,next) => {
  Home.find().then(registeredHomes => {
      res.render('admin/list-home',
      {registeredHomes:registeredHomes,
         isLoggedIn: req.session.isLoggedIn,
         user: req.session.user,
      });
      });
}

exports.postAddHome = (req,res,next) => {

   const { houseName, price, location, rating,
      description} = req.body;
      
      if (!req.file){
         return res.status(422).send("No image provided");
      }
     const photo = `/uploads/${req.file.filename}`;

      const home = new Home({houseName,price,location,rating,photo,description});
      home.save().then(() => {
         console.log('Home Saved Successfully');
            res.redirect("/host/list-home");
      });

      // res.render("admin/home-added",{
      //    pageTitle: "Home Added Successfully",
      //    currentPage: "homeAdded",
      // });
   
      };
   
exports.postEditHome = (req, res, next) => {
  const { _id, houseName, price, location, rating, description } = req.body;

  Home.findById(_id).then((home) => {
    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;
    home.description = description;
   if (req.file) {
      home.photo = req.file.path;
   }    

    home.save().then((result) => {
      console.log('Home updated',result);
    })
    res.redirect('/host/list-home');
});

};


exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;

  Home.findById(homeId)
    .then(home => {
      if (!home) {
        return res.redirect("/host/list-home");
      }

      // home.photo = "/uploads/filename.jpg"
      const filePath = path.join(
        __dirname,
        "..",
        home.photo   // removes leading slash safely
      );

      // Delete file
      fs.unlink(filePath, err => {
        if (err) {
          console.log("Image delete failed:", err);
        }
      });

      // Delete DB record
      return Home.findByIdAndDelete(homeId);
    })
    .then(() => {
      res.redirect("/host/list-home");
    })
    .catch(err => console.log(err));
};

