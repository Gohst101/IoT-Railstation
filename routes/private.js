const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { checkUserLoggedIn } = require('../middleware/checkUserLoggedIn.js');

// Private Routes - Nur für angemeldete Benutzer | Man checkt

router.get('/dashboard', checkUserLoggedIn, (req, res) => {
  res.render('private/dashboard', { user: req.session.user });
});

// Tracks - INFO: Later add Loading Tracks via JSON Storage!!!
router.get('/tracks', checkUserLoggedIn, (req, res) => {
  res.render('private/tracks', { user: req.session.user });
});


module.exports = router;