# We MONEY

**Versi: V1.4.11**

**Catat Uangmu, Rencanakan Masa Depanmu**

Aplikasi pencatatan keuangan pribadi dengan React + Vite dan Supabase.

## Branding resmi
- **App Icon:** Wallet + W
- **Logo / Brand:** We MONEY
- **Tagline:** Catat Uangmu, Rencanakan Masa Depanmu
- Pedoman lengkap: `docs/BRAND_GUIDELINES.md`

## Stack
- React 19 + Vite 7
- Tailwind CSS 4
- Lucide React
- Recharts
- Supabase Auth + PostgreSQL + Row Level Security (RLS)
- Tesseract.js 6 untuk OCR di browser

## Fitur utama
- Dashboard keuangan
- Transaksi pemasukan dan pengeluaran
- Edit dan hapus transaksi
- Pencarian dan filter transaksi
- Pagination riwayat transaksi
- Transfer antar dompet
- Kategori dan manajemen dompet
- Laporan
- Export transaksi ke CSV
- Smart Receipt / OCR transient berbasis browser
- Review dan koreksi hasil OCR sebelum disimpan
- Hasil OCR yang sudah diverifikasi disimpan sebagai data terstruktur di database
- File receipt tidak disimpan di Supabase Storage
- File receipt hanya hidup selama proses OCR dan dilepas setelah pemrosesan/verifikasi
- Reset data keuangan
- Panduan penggunaan
- Proteksi RLS berbasis `user_id`
- Pengajuan penghapusan akun melalui administrator

## Kebijakan Receipt / OCR
We MONEY **tidak menjadi gudang arsip foto struk**.

Alur yang ditetapkan:

`File receipt → proses sementara di browser → OCR → user verifikasi → simpan hasil teks/angka → file dibuang`

Tidak digunakan:
- Supabase Storage sebagai penyimpanan receipt
- localStorage sebagai penyimpanan receipt atau hasil transaksi

OCR saat ini menggunakan Tesseract.js dan memproses foto JPG, PNG, atau WEBP di browser. Tidak ada secret OCR API yang ditanamkan ke frontend dan file receipt tidak dikirim ke Supabase Storage.

Database hanya menyimpan hasil yang sudah dikonfirmasi seperti merchant, tanggal, subtotal, diskon, pajak, total, confidence, dan teks OCR terpotong untuk konteks hasil pemrosesan. User tetap wajib memeriksa nominal sebelum transaksi disimpan.

PDF belum menjadi input OCR pada implementasi ini; dukungan PDF dapat ditambahkan kemudian melalui rasterisasi halaman tanpa mengubah kebijakan transient storage.

## Kebijakan penghapusan akun
Pengguna **tidak dapat menghapus akun secara langsung dari aplikasi**.

Sebelum mengajukan penghapusan, akun harus benar-benar kosong: transaksi, transfer, dompet, kategori, anggaran, struk, dan transaksi berulang harus tidak memiliki data untuk user tersebut. Sistem melakukan pemeriksaan ini saat pengajuan.

Setelah lolos pemeriksaan, We MONEY hanya membuat pengajuan berstatus `pending`. Administrator tetap dikelola di Supabase dan melakukan pemeriksaan serta proses penghapusan akun secara administratif.

## Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and configure the Supabase client values.

## Production

```bash
npm run build
```

Deployment production menggunakan GitHub Actions dan GitHub Pages. SPA fallback `404.html` disiapkan agar routing React tetap dapat digunakan pada GitHub Pages.

## Database

Migration berada di `supabase/migrations/`. Perubahan DDL harus diterapkan melalui migration agar schema production dan repository tetap sinkron.

## Status

V1.4.11 — Build dan release terakhir berhasil. Smart Receipt/OCR browser aktif untuk JPG/PNG/WEBP dengan review sebelum penyimpanan. File receipt tidak disimpan di Storage dan tidak menggunakan localStorage. Validasi transaksi kini konsisten dengan aturan database bahwa dompet wajib dipilih.

© 2026 Created Jsuryana