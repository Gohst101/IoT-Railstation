const express = require('express');
const router = express.Router();
const { redirectIfLoggedIn } = require('../middleware/checkUserLoggedIn.js');
const { handleLogin, handleLogout } = require('../controller/auth.js');

// Login
router.get('/', (req, res) => {
  res.redirect('/login');
});

// Login
router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('public/login');
});

// Login POST Request
router.post('/login', redirectIfLoggedIn, handleLogin);

// Logout
router.get('/logout', handleLogout);

// weiteres oder so



module.exports = router;