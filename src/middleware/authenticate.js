const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.cookies?.token; // Ambil token dari cookie
  if (!token) {
    return res.redirect('/auth/login'); // Redirect jika tidak ada token
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // Simpan data user di request
    next();
  } catch (err) {
    console.error(err);
    res.redirect('/auth/login');
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send('Akses ditolak. Anda bukan admin.');
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };
