const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const pendaftarRoutes = require("./routes/pendaftar");
const pembelianRoutes = require("./routes/pembelian");
const adminRoutes = require("./routes/admin");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const { pool } = require("./config/db");

dotenv.config();

const app = express();

// Konfigurasi View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(cookieParser()); // Pindahkan ke atas sebelum rute admin
app.use(
  "/admin",
  express.static(path.join(__dirname, "../admin")),
  adminRoutes
);
app.use(cookieParser());
app.use("/pembelian", pembelianRoutes);
app.use(bodyParser.json());

// Routes
app.use("/auth", authRoutes);
app.use("/pendaftar", pendaftarRoutes);

// Konfigurasi Upload File
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../admin/aset"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Halaman Utama
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Halaman Admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../admin/dashboard"));
});

//dashboard
app.get("/admin/dashboard", (req, res) => {
  const queryTotalProduk = "SELECT COUNT(*) AS total_produk FROM product";
  const queryTotalPesanan = "SELECT COUNT(*) AS total_pesanan FROM pemesanan";
  const queryTotalPelanggan =
    "SELECT COUNT(*) AS total_pelanggan FROM pelanggan";
  const queryTotalPendapatan = `
    SELECT SUM(total_harga) AS total_pendapatan 
    FROM pemesanan 
    WHERE MONTH(tanggal_pemesanan) = MONTH(CURRENT_DATE()) AND YEAR(tanggal_pemesanan) = YEAR(CURRENT_DATE())`;
  const queryRecentOrders = `
    SELECT id_pemesanan, nama_pelanggan, total_harga, tanggal_pemesanan, status
    FROM pemesanan
    ORDER BY tanggal_pemesanan DESC
    LIMIT 5`; // Ambil 5 pesanan terbaru

  const data = {}; // Untuk menyimpan hasil dari setiap query

  pool.query(queryTotalProduk, (err, results) => {
    if (err) {
      console.error("Gagal mengambil total produk:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }
    data.totalProduk = results[0].total_produk;

    pool.query(queryTotalPesanan, (err, results) => {
      if (err) {
        console.error("Gagal mengambil total pesanan:", err);
        return res.status(500).send("Terjadi kesalahan pada server.");
      }
      data.totalPesanan = results[0].total_pesanan;

      pool.query(queryTotalPelanggan, (err, results) => {
        if (err) {
          console.error("Gagal mengambil total pelanggan:", err);
          return res.status(500).send("Terjadi kesalahan pada server.");
        }
        data.totalPelanggan = results[0].total_pelanggan;

        pool.query(queryTotalPendapatan, (err, results) => {
          if (err) {
            console.error("Gagal mengambil total pendapatan:", err);
            return res.status(500).send("Terjadi kesalahan pada server.");
          }
          data.totalPendapatan = results[0].total_pendapatan || 0;

          pool.query(queryRecentOrders, (err, results) => {
            if (err) {
              console.error("Gagal mengambil data pesanan terbaru:", err);
              return res.status(500).send("Terjadi kesalahan pada server.");
            }
            data.recentOrders = results;

            // Kirim hasil ke dashboard
            res.render("dashboard", {
              totalProduk: data.totalProduk,
              totalPesanan: data.totalPesanan,
              totalPelanggan: data.totalPelanggan,
              totalPendapatan: data.totalPendapatan,
              recentOrders: data.recentOrders, // Kirim data pesanan terbaru
            });
          });
        });
      });
    });
  });
});

// khusus produk
app.get("/admin/produk", (req, res) => {
  const query = `
    SELECT id_product AS id_produk, nama_product AS nama, harga, stock AS stok, deskripsi AS kategori, gambar 
    FROM product
    ORDER BY id_product ASC`;

  pool.query(query, (err, results) => {
    if (err) {
      console.error("Gagal mengambil data produk:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }

    // Kirim data produk ke template
    res.render("produk", { produk: results });
  });
});

//khusus pesanan
app.get("/admin/pesanan", (req, res) => {
  const query = `
    SELECT id_pemesanan, nama_pelanggan, total_harga, status 
    FROM pemesanan
    ORDER BY tanggal_pemesanan DESC`;

  pool.query(query, (err, results) => {
    if (err) {
      console.error("Gagal mengambil data pemesanan:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }

    // Kirim data ke template
    res.render("pesanan", { pesanan: results });
  });
});

app.post("/admin/pesanan/update/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const query = `UPDATE pemesanan SET status = ? WHERE id_pemesanan = ?`;

  pool.query(query, [status, id], (err) => {
    if (err) {
      console.error("Gagal memperbarui status pesanan:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }
    res.status(200).send("Status pesanan berhasil diperbarui.");
  });
});

//khusus pelanggan
app.get("/admin/pelanggan", (req, res) => {
  const query = "SELECT * FROM pelanggan"; // Sesuaikan dengan nama tabel pelanggan Anda
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Gagal mengambil data pelanggan:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }
    res.render("pelanggan", { pelanggan: results });
  });
});

//khusus pembayaran
app.get("/admin/pembayaran", (req, res) => {
  const query = "SELECT * FROM pembayaran"; // Sesuaikan dengan nama tabel pembayaran Anda
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Gagal mengambil data pembayaran:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }
    res.render("pembayaran", { pembayaran: results });
  });
});

// tambah produk di produk.ejs
app.post("/admin/produk/tambah", upload.single("gambar"), (req, res) => {
  const { nama_produk, kategori, harga, stok } = req.body;
  const gambar = `/admin/aset/${req.file.filename}`;

  const query = `
    INSERT INTO product (nama_product, deskripsi, harga, stock, gambar)
    VALUES (?, ?, ?, ?, ?)`;

  pool.query(query, [nama_produk, kategori, harga, stok, gambar], (err) => {
    if (err) {
      console.error("Gagal menambahkan produk:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }
    res.redirect("/admin/produk");
  });
});

// hapus produk di produk.ejs
app.post("/admin/produk/hapus/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM product WHERE id_product = ?";
  pool.query(query, [id], (err) => {
    if (err) {
      console.error("Gagal menghapus produk:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }
    res.redirect("/admin/produk");
  });
});

//edit produk di produk.ejs
app.post("/admin/produk/edit", upload.single("gambar"), (req, res) => {
  console.log("Data diterima untuk edit:", req.body);
  if (req.file) console.log("File diterima:", req.file);

  const { id_produk, nama_produk, kategori, harga, stok } = req.body;
  const gambar = req.file ? `/admin/aset/${req.file.filename}` : null;

  const query = gambar
    ? `UPDATE product SET nama_product = ?, deskripsi = ?, harga = ?, stock = ?, gambar = ? WHERE id_product = ?`
    : `UPDATE product SET nama_product = ?, deskripsi = ?, harga = ?, stock = ? WHERE id_product = ?`;

  const params = gambar
    ? [nama_produk, kategori, harga, stok, gambar, id_produk]
    : [nama_produk, kategori, harga, stok, id_produk];

  pool.query(query, params, (err) => {
    if (err) {
      console.error("Gagal mengedit produk:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }
    res.redirect("/admin/produk");
  });
});

//Terima Pelanggan//
app.post("/admin/pelanggan/terima/:id", (req, res) => {
  const { id } = req.params;
  const query = `UPDATE pemesanan SET status = 'diterima' WHERE id_pelanggan = ?`;

  pool.query(query, [id], (err) => {
    if (err) {
      console.error("Gagal memperbarui status pesanan:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }
    res.status(200).send("Pesanan diterima.");
  });
});

//Tolak Pelanggan//
app.post("/admin/pelanggan/tolak/:id", (req, res) => {
  const { id } = req.params;
  const query = `UPDATE pemesanan SET status = 'ditolak' WHERE id_pelanggan = ?`;

  pool.query(query, [id], (err) => {
    if (err) {
      console.error("Gagal memperbarui status pesanan:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }
    res.status(200).send("Pesanan ditolak.");
  });
});

// Tambahkan rute POST untuk form pembelian
app.post("/pembelian/submit", (req, res) => {
  const { nama, jk, alamat, tanggal_daftar } = req.body;

  // Validasi data
  if (!nama || !jk || !alamat || !tanggal_daftar) {
    return res.status(400).send("Semua data harus diisi!");
  }

  // Query SQL untuk menyimpan data ke database
  const query = `
    INSERT INTO pembelian (nama, jenis_kelamin, alamat, tanggal_pengantaran)
    VALUES (?, ?, ?, ?)
  `;

  pool.query(query, [nama, jk, alamat, tanggal_daftar], (err, results) => {
    if (err) {
      console.error("Gagal menyimpan data pembelian:", err);
      return res.status(500).send("Terjadi kesalahan pada server.");
    }

    // Redirect atau kirim respons sukses
    res.status(200).send("Pembelian berhasil!");
  });
});

// Jalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
