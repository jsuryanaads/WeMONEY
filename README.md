# WeMoney

**Versi: V1.3.0**

**Catat Uangmu, Rencanakan Masa Depanmu**

Aplikasi pencatatan keuangan pribadi dengan React + Vite dan Supabase.

## Stack
- React 19 + Vite 7
- Tailwind CSS 4
- Lucide React
- Recharts
- Supabase Auth + PostgreSQL + Row Level Security (RLS)

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
- Smart Receipt / OCR dengan prinsip transient processing
- Hasil OCR yang sudah diverifikasi disimpan sebagai data terstruktur di database
- File receipt tidak disimpan di Supabase Storage
- File receipt hanya hidup selama proses OCR dan dibuang setelah selesai
- Reset data keuangan
- Panduan penggunaan
- Proteksi RLS berbasis `user_id`
- Pengajuan penghapusan akun melalui administrator

## Kebijakan Receipt / OCR
WeMoney **tidak menjadi gudang arsip foto struk**.

Alur yang ditetapkan:

`File receipt → proses sementara → OCR → user verifikasi → simpan hasil teks/angka → file dibuang`

Tidak digunakan:
- Supabase Storage sebagai penyimpanan receipt
- localStorage sebagai penyimpanan receipt atau hasil transaksi

Database hanya menyimpan informasi hasil pemrosesan seperti merchant, tanggal, subtotal, diskon, pajak, total, status OCR, dan data OCR terstruktur/raw bila diperlukan. Engine OCR belum diaktifkan pada V1.3.0; integrasinya harus mengikuti alur transient ini dan tidak boleh mengunggah file receipt ke Storage.

## Kebijakan penghapusan akun
Pengguna **tidak dapat menghapus akun secara langsung dari aplikasi**.

Sebelum mengajukan penghapusan, akun harus benar-benar kosong: transaksi, transfer, dompet, kategori, anggaran, struk, dan transaksi berulang harus tidak memiliki data untuk user tersebut. Sistem melakukan pemeriksaan ini saat pengajuan.

Setelah lolos pemeriksaan, WeMoney hanya membuat pengajuan berstatus `pending`. Administrator tetap dikelola di Supabase dan melakukan pemeriksaan serta proses penghapusan akun secara administratif.

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

V1.3.0 — transaction workflow ditingkatkan dengan edit, search/filter, pagination, dan arsitektur Smart Receipt/OCR transient. OCR engine belum diaktifkan. Implementasi OCR berikutnya wajib memproses file sementara dan hanya menyimpan hasil yang telah diverifikasi.

© 2026 Created Jsuryana