const express = require("express");
const db = require("../config/db"); // Koneksi database
const router = express.Router();

// Ambil semua data pemesanan
router.get("/", (req, res) => {
  const query = `
    SELECT id_pemesanan, id_pelanggan, id_user, id_product, nama_pelanggan, total_harga, status, tanggal_pemesanan
    FROM pemesanan
    ORDER BY tanggal_pemesanan DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Gagal mengambil data pemesanan:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }
    res.json(results);
  });
});

// Tambah pemesanan baru
router.post("/tambah", (req, res) => {
  const {
    id_pelanggan,
    id_user,
    id_product,
    nama_pelanggan,
    total_harga,
    status,
  } = req.body;

  // Validasi data
  const validStatuses = [
    "pending",
    "processed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res
      .status(400)
      .send(
        "Status tidak valid. Pilihan yang tersedia: pending, processed, shipped, delivered, cancelled."
      );
  }

  if (
    !id_pelanggan ||
    !id_user ||
    !id_product ||
    !nama_pelanggan ||
    !total_harga
  ) {
    return res.status(400).send("Semua data kecuali status harus diisi!");
  }

  const query = `
    INSERT INTO pemesanan (id_pelanggan, id_user, id_product, nama_pelanggan, total_harga, status, tanggal_pemesanan)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;
  db.query(
    query,
    [id_pelanggan, id_user, id_product, nama_pelanggan, total_harga, status],
    (err) => {
      if (err) {
        console.error("Gagal menambahkan pemesanan:", err);
        return res.status(500).send("Terjadi kesalahan pada server.");
      }
      res.status(201).send("Pemesanan berhasil ditambahkan.");
    }
  );
});

// Perbarui status pemesanan
router.put("/update/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validasi status
  const validStatuses = [
    "pending",
    "processed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res
      .status(400)
      .send(
        "Status tidak valid. Pilihan yang tersedia: pending, processed, shipped, delivered, cancelled."
      );
  }

  const query = `UPDATE pemesanan SET status = ? WHERE id_pemesanan = ?`;
  db.query(query, [status, id], (err) => {
    if (err) {
      console.error("Gagal memperbarui status pemesanan:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }
    res.status(200).send("Status pemesanan berhasil diperbarui.");
  });
});

// Hapus pemesanan
router.delete("/hapus/:id", (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM pemesanan WHERE id_pemesanan = ?`;
  db.query(query, [id], (err) => {
    if (err) {
      console.error("Gagal menghapus pemesanan:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }
    res.status(200).send("Pemesanan berhasil dihapus.");
  });
});

module.exports = router;
