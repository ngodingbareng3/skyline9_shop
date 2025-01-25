const express = require('express');
const PendaftarController = require('../controllers/PendaftarController');
const router = express.Router();

router.get('/', PendaftarController.getAll);

module.exports = router;
