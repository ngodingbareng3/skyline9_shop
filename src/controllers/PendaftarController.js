const Pendaftar = require('../models/Pendaftar');

const PendaftarController = {
  getAll: async (req, res) => {
    try {
      const pendaftar = await Pendaftar.getAll();
      res.render('pendaftar', { pendaftar });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  },
};

module.exports = PendaftarController;
