# We MONEY

**Versi saat ini: V1.7.7**

**Catat Uangmu, Rencanakan Masa Depanmu**

We MONEY adalah aplikasi pencatatan dan pengelolaan keuangan pribadi yang berfokus pada transaksi, dompet, anggaran, laporan, hutang/piutang/tagihan, serta integrasi AI dan Telegram.

### V1.7.7 — Android Blank Screen Fix
**Status:** Current

Perubahan:
- Memperbaiki build Capacitor agar asset web menggunakan path relatif di Android.
- Menormalkan `BrowserRouter` untuk runtime Capacitor.
- Menambahkan helper build Capacitor lintas Windows/Linux.
- Tidak mengubah logika keuangan atau struktur data.

## Riwayat Versi

### V1.7.6 — Lively Modern Fintech UI
**Status:** Previous

Perubahan:
- Menyegarkan Dashboard dengan sapaan pengguna, status aktif, dan call-to-action yang lebih jelas.
- Menambahkan shortcut visual untuk **Catat transaksi** dan **Lihat laporan**.
- Menambahkan ambient glow, micro-interaction, hover motion, entrance animation, dan subtle pulse pada elemen utama.
- Mempertahankan identitas **We MONEY — Modern Fintech** tanpa menambah pilihan tema visual baru.
- Tetap mendukung Mode Tampilan **Sistem / Terang / Gelap**.
- Perubahan bersifat visual dan tidak mengubah struktur atau logika data keuangan.


### V1.7.5 — Android Icon & Release Hardening
**Status:** Previous

Perubahan:
- Menetapkan `resources/icon.png` sebagai master icon WeMONEY untuk Android.
- Menghapus sumber icon SVG rekonstruksi agar tidak terjadi perbedaan visual dengan icon resmi.
- Memperkuat workflow Android agar sumber PNG dan launcher resources diverifikasi sebelum APK/AAB dibangun.
- Android release tetap terpisah dari web release dengan tag `android-v1.7.5`.
- Production Android wajib menghasilkan signed APK dan signed AAB.
- Menambahkan aturan release terpisah pada [RELEASE_RULES.md](RELEASE_RULES.md).

### V1.7.4 — Device & Build Hardening
**Status:** Previous

Perubahan:
- Memperbaiki sintaks `deviceService.js` yang menyebabkan production build gagal.
- Menghapus duplikasi fungsi ganti password pada Pengaturan.
- Membersihkan reset state modal yang duplikat.
- Memastikan normalisasi instalasi perangkat menggunakan pemanggilan RPC yang valid.

### V1.7.0 — Notification Center
**Status:** Previous

Perubahan:
- Mengaktifkan ikon **Notifikasi** pada header menjadi Notification Center.
- Menampilkan pengingat hutang, piutang, dan tagihan yang terlambat atau jatuh tempo dalam 3 hari.
- Menampilkan peringatan anggaran saat penggunaan mencapai 80% atau lebih.
- Notifikasi memiliki tautan langsung ke modul terkait.
- Mendukung **Tandai sudah dibaca** dan **Tandai semua sudah dibaca**.
- Status baca disimpan per pengguna pada browser dan tidak mengubah data keuangan.
- Tidak ada mutasi transaksi atau kewajiban yang dilakukan oleh sistem notifikasi.

### V1.6.1 — Security & Performance Hardening
**Status:** Previous

Perubahan:
- Menambahkan index untuk foreign key obligation_payments.transaction_id.
- Mengoptimalkan policy RLS dengan evaluasi auth.uid() sekali per statement pada koneksi Telegram dan modul Anggaran.
- Menambahkan deny policy eksplisit untuk tabel internal Telegram dan mencabut privilege client langsung.
- Menjadikan penghapusan transaksi dan receipt atomic melalui RPC terproteksi ownership.
- Memperkuat jalur database tanpa memberikan akses mutasi finansial kepada AI.

Setiap perubahan versi wajib dicatat di README ini. `package.json` menjadi **single source of truth** untuk nomor versi aplikasi, sedangkan README menjadi dokumentasi perubahan versi dan fitur.

### V1.6.0 — Pengaturan Keamanan Akun
**Status:** Previous

Perubahan:
- Menambahkan menu **Ganti Password** pada Pengaturan → Profil.
- Pengguna dapat membuat password baru dan melakukan konfirmasi password.
- Password baru memiliki validasi minimal 8 karakter.
- Proses perubahan password menggunakan autentikasi Supabase.
- Menambahkan feedback berhasil/gagal pada proses perubahan password.
- Menyesuaikan nomor versi aplikasi menjadi `1.6.0`.

### V1.5.0 — Hutang, Piutang, Tagihan & Hybrid AI
**Status:** Released

Perubahan:
- Menambahkan modul **Hutang, Piutang, dan Tagihan**.
- Mendukung status kewajiban: open, paid, dan cancelled.
- Mendukung pembayaran kewajiban yang otomatis dicatat sebagai transaksi.
- Menambahkan pencatatan pembayaran kewajiban secara atomic melalui RPC.
- Menambahkan integrasi **Hybrid AI** untuk interpretasi input keuangan.
- Menambahkan integrasi **OpenRouter** melalui Supabase Edge Function.
- Menambahkan **Telegram free-form AI** untuk memahami pesan keuangan pengguna.
- Telegram menggunakan alur **interpretasi → draft → konfirmasi → penyimpanan** dan tidak menyimpan transaksi tanpa konfirmasi.
- Memperbaiki pengambilan data Budget agar tidak dibatasi 1.000 transaksi.
- Memperbaiki pengambilan data Reports agar periode 12 bulan tidak dibatasi 1.000 transaksi.
- Memperbaiki beberapa pemrosesan tanggal agar menggunakan tanggal lokal.
- Menambahkan hardening keamanan pada fungsi Telegram bot token.
- Menambahkan migration database untuk modul kewajiban dan pembayaran.
- Menetapkan `main` sebagai basis production V1.5.0.
- Tag release: `v1.5.0`.

### V1.4.19 — Baseline Sebelum V1.5.0
**Status:** Previous production version

- Merupakan versi production yang tampil sebelum rilis V1.5.0.
- Versi ini menjadi baseline sebelum penambahan modul Hutang & Tagihan, Hybrid AI, Telegram AI, serta perbaikan Budget dan Reports pada V1.5.0.

> **Catatan:** Riwayat di atas hanya mencantumkan versi yang dapat diverifikasi dari repository dan perubahan yang terdokumentasi. Versi lama yang belum memiliki dokumentasi perubahan tidak akan ditebak atau dibuat-buat.

## Aturan Versioning

We MONEY menggunakan format `MAJOR.MINOR.PATCH`.

- **PATCH** — perbaikan bug, keamanan, UI/UX, atau perubahan non-breaking.
- **MINOR** — fitur baru yang backward-compatible.
- **MAJOR** — perubahan arsitektur atau breaking change.

### Aturan Release

Aturan lengkap web dan Android release tersimpan di [RELEASE_RULES.md](RELEASE_RULES.md).

- Web: `vX.Y.Z`
- Android: `android-vX.Y.Z`
- Web dan Android memiliki release terpisah.
- `package.json` adalah single source of truth untuk versi.

### Aturan Dokumentasi

Setiap perubahan versi harus memperbarui **dua tempat**:

1. `package.json` → nomor versi aplikasi.
2. `README.md` → nomor versi dan daftar perubahan.

Untuk setiap release baru, gunakan format:

`Vx.y.z — Nama Release`

Kemudian tuliskan:
- Status release.
- Fitur baru.
- Perbaikan.
- Perubahan keamanan.
- Perubahan database/API jika ada.
- Catatan kompatibilitas atau breaking change jika ada.
- Tag release jika sudah dibuat.

Dengan aturan ini, README selalu menjadi **changelog ringkas dan historis** dari perkembangan We MONEY.

## Komponen Utama

- Dashboard
- Transaksi
- Kategori
- Dompet
- Anggaran
- Hutang & Tagihan
- Laporan
- Pengaturan
- Telegram
- Hybrid AI / OpenRouter

## Repository

[GitHub Repository — WeMONEY](https://github.com/jsuryanaads/WeMONEY)

## Deployment

Production web: GitHub Pages (`main`). Setiap perubahan ke `main` memicu build dan deployment otomatis setelah pemeriksaan CI berhasil.
