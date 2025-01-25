const express = require('express');
const path = require('path');
const { authenticate, authorizeAdmin } = require('../middleware/authenticate');
const router = express.Router();

// Redirect ke dashboard dinamis
router.get('/', authenticate, authorizeAdmin, (req, res) => {
  res.redirect('/admin/dashboard');
});

module.exports = router;
