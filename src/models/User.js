const db = require('../config/db');

const User = {
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
    return rows[0];
  },
  create: async (username, email, password, role = 'user') => {
    const [result] = await db.query('INSERT INTO user (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, password, role]);
    return result.insertId;
  },
};

module.exports = User;
