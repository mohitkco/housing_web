const { check, validationResult } = require('express-validator');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

/* ================= LOGIN ================= */

exports.login = (req, res) => {
  res.render('auth/login', {
    isLoggedIn: false,
    errors: [],
    oldInput: {},
    user: {},
  });
};

exports.postlogin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(422).render('auth/login', {
      isLoggedIn: false,
      errors: [{ msg: 'User does not exist' }],
      oldInput: { email },
      user: req.session.user,
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(422).render('auth/login', {
      isLoggedIn: false,
      errors: [{ msg: 'Invalid email or password' }],
      oldInput: { email }
    });
  }

  req.session.isLoggedIn = true;
  req.session.user = user;
  await req.session.save();
  res.redirect('/');
};

exports.postlogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

/* ================= SIGNUP ================= */

exports.signup = (req, res) => {
  res.render('auth/signup', {
    isLoggedIn: false,
    errors: [],
    oldInput: {
      firstName: '',
      lastName: '',
      email: '',
      userType: '',
      user: {},
    }
  });
};

exports.postSignup = [

  // First Name
  check('firstName')
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2 }).withMessage('First name must be at least 2 characters long')
    .matches(/^[A-Za-z\s]+$/).withMessage('First name can only contain letters'),

  // Last Name (optional)
  check('lastName')
    .optional({ checkFalsy: true })
    .matches(/^[A-Za-z\s]+$/).withMessage('Last name can only contain letters'),

  // Email
  check('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  // Password
  check('password')
    .isLength({ min: 4 }).withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),

  // Confirm password
  check('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  // User Type
  check('userType')
    .isIn(['guest', 'host']).withMessage('User type is required'),

  // Terms
  check('termsAccepted')
    .equals('on').withMessage('You must accept the terms and conditions'),

  async (req, res) => {
    const { firstName, lastName, email, password, userType } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render('auth/signup', {
        isLoggedIn: false,
        errors: errors.array(),   // ✅ KEEP REAL ERRORS
        oldInput: {
          firstName,
          lastName,
          email,
          userType,
          user: req.session.user,
        }
      });
    }

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(422).render('auth/signup', {
          isLoggedIn: false,
          errors: [{ msg: 'Email already exists' }],
          oldInput: {
            firstName,
            lastName,
            email,
            userType
          }
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        userType
      });

      await user.save();
      res.redirect('/login');

    } catch (err) {
      console.error(err);
      return res.status(500).render('auth/signup', {
        isLoggedIn: false,
        errors: [{ msg: 'Something went wrong. Please try again.' }],
        oldInput: {
          firstName,
          lastName,
          email,
          userType
        }
      });
    }
  }
];
