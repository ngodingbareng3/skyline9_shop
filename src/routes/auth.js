const express = require('express');
const AuthController = require('../controllers/AuthController');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Halaman Login
router.get('/login', (req, res) => {
  res.render('login');
});

// Halaman Daftar
router.get('/register', (req, res) => {
  res.render('register');
});

// Proses Pendaftaran
router.post('/register', async (req, res) => {
  const { username, email, password, role, adminCode } = req.body;
  const bcrypt = require('bcryptjs');
  const User = require('../models/User');

  try {
    // Validasi role
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).send('Role tidak valid');
    }

    // Validasi kode admin
    if (role === 'admin') {
      const SECRET_ADMIN_CODE = process.env.ADMIN_CODE; // Ganti dengan kode rahasia Anda
      if (adminCode !== SECRET_ADMIN_CODE) {
        return res.status(403).send('Kode admin tidak valid');
      }
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan ke database
    const User = require('../models/User');
    await User.create(username, email, hashedPassword, role);

    // Redirect ke halaman login
    res.redirect('/auth/login');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Proses Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');

  try {
    const user = await User.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send('Email atau password salah');
    }

    // Simpan token atau sesi (sesuai kebutuhan)
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.cookie('token', token, { httpOnly: true });

    // Redirect sesuai role
    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Rute Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token'); // Hapus cookie token
  res.redirect('/'); // Redirect ke halaman utama
});

module.exports = router;
