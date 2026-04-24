const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { checkUserLoggedIn } = require('../middleware/checkUserLoggedIn.js');

// Loads the Devices from the Storage Device Directory
function loadDeviceDirectory() {
  const deviceDirectoryPath = path.join(__dirname, '..', 'storage', 'application', 'device_directory.json');

  try {
    const fileContent = fs.readFileSync(deviceDirectoryPath, 'utf8');
    const parsedContent = JSON.parse(fileContent);

    return Array.isArray(parsedContent) ? parsedContent : [];
  } catch (error) {
    console.error('[Private Routes] Failed to load device directory:', error.message);
    return [];
  }
}

// Private Routes - Nur für angemeldete Benutzer | Man checkt
router.get('/dashboard', checkUserLoggedIn, (req, res) => {
  res.render('private/dashboard', { user: req.session.user });
});

// Tracks
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

// Device Overview
router.get('/devices', checkUserLoggedIn, (req, res) => {
  const devices = loadDeviceDirectory();

  res.render('private/device_overview', {
    user: req.session.user,
    devices
  });
});

module.exports = router;