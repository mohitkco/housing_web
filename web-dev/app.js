require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.DATABASE_URL;
 

const userRouter = require("./routes/userRouter");
const { hostRouter } = require("./routes/hostRouter");
const { errorRouter } = require("./routes/errorRouter");
const authRouter = require("./routes/authRouter");

const app = express();

/* ---------------- RANDOM STRING ---------------- */
const randomString = (length) => {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return result;
};

/* ---------------- UPLOADS FOLDER ---------------- */
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* ---------------- MULTER CONFIG ---------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // ✅ correct path
  },
  filename: (req, file, cb) => {
    const uniqueName = randomString(10);
    cb(null, uniqueName + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if ([ 'image/jpeg' , 'image/png' , 'image/jpg' ].includes(file.mimetype)){
    cb(null, true);
  }else{
    cb(null, false);
  }
}


const multerOptions = { storage, fileFilter };

/* ---------------- MIDDLEWARES ---------------- */
app.use(express.static("public"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));// serve images
app.use(express.urlencoded({ extended: true }));
app.use(multer(multerOptions).single("photo"));

/* ---------------- SESSION STORE ---------------- */
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: "sessions",
});

app.use(
  session({
    secret: "my web secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

/* ---------------- GLOBAL VAR ---------------- */
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

/* ---------------- VIEW ENGINE ---------------- */
app.set("view engine", "ejs");
app.set("views", "views");

/* ---------------- ROUTES ---------------- */
app.use(userRouter);

app.use("/host", (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
  next();
});

app.use("/host", hostRouter);
app.use(authRouter);
app.use(errorRouter);

/* ---------------- SERVER ---------------- */
const PORT = process.env.PORT || 3000;

mongoose
  .connect(DB_PATH)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server started at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err);
  });
