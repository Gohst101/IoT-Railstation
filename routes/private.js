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

router.get('/track/:trackname', checkUserLoggedIn, (req, res) => {
  res.render('private/track', {
    user: req.session.user,
    trackName: req.params.trackname
  });
});

router.get('/track/:trackname/edit', checkUserLoggedIn, (req, res) => {
  res.render('private/track_edit', {
    user: req.session.user,
    trackName: req.params.trackname
  });
});

// Device Overview - INFO: Later add Loading Devices from via JSON Storage!!!
router.get('/devices', checkUserLoggedIn, (req, res) => {
  res.render('private/device_overview', { user: req.session.user });
});

module.exports = router;