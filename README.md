# WeMoney

**Versi: V1.2.2**

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
- Transfer antar dompet
- Kategori dan manajemen dompet
- Laporan
- Export transaksi ke CSV
- Reset data keuangan
- Panduan penggunaan
- Proteksi RLS berbasis `user_id`
- Pengajuan penghapusan akun melalui administrator

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

V1.2.2 — aplikasi menggunakan Supabase untuk autentikasi dan data keuangan, dengan pengamanan RLS, reset data, export CSV, dan alur pengajuan penghapusan akun yang membutuhkan pemeriksaan administrator.

© 2026 Created Jsuryana
