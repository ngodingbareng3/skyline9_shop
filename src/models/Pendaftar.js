const db = require('../config/db');

const Pendaftar = {
  getAll: async () => {
    const [rows] = await db.query('SELECT * FROM pendaftar');
    return rows;
  },
  create: async (noPendaftaran, namaLengkap, email, programStudi, tanggalDaftar, userId) => {
    const [result] = await db.query('INSERT INTO pendaftar (no_pendaftaran, nama_lengkap, email, program_studi, tanggal_daftar, user_id) VALUES (?, ?, ?, ?, ?, ?)', [noPendaftaran, namaLengkap, email, programStudi, tanggalDaftar, userId]);
    return result.insertId;
  },
};

module.exports = Pendaftar;
