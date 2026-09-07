# WeMoney V1 — Phase Checkpoints

Setiap phase wajib berhenti di checkpoint sebelum phase berikutnya.

## Aturan checkpoint

1. Perubahan harus dapat ditelusuri dari commit GitHub.
2. Database utama tetap Supabase PostgreSQL; tidak memakai dummy data sebagai database utama.
3. Tidak ada secret/service-role key di frontend atau repository.
4. Setelah implementasi, lakukan audit struktur, dependency, route, dan konfigurasi.
5. Build check wajib dijalankan melalui GitHub Actions sebelum phase dinyatakan lulus.
6. Jika checkpoint gagal, perbaiki phase aktif terlebih dahulu; jangan lanjut ke phase berikutnya.
7. Fitur phase berikutnya tidak boleh menyamarkan kegagalan phase sebelumnya.

## Phase 2B — Auth + Frontend Connection

Status: **IMPLEMENTED — CHECKPOINT PENDING BUILD RUN**

Checklist:

- [x] Supabase client menggunakan publishable key dari environment.
- [x] Session persistence dan auto refresh diaktifkan.
- [x] Login email/password.
- [x] Register email/password.
- [x] Logout service tersedia.
- [x] Forgot password.
- [x] Reset password.
- [x] Protected route untuk modul aplikasi.
- [x] Public-only redirect untuk login/register.
- [x] Profile dibuat/diperbarui setelah user terautentikasi.
- [x] Default kategori dibuat per user melalui RLS.
- [x] Tidak menggunakan service-role key.
- [x] Supabase JS version dipin ke 2.102.0.
- [x] Automated GitHub Actions build check ditambahkan.
- [ ] Build GitHub Actions hijau.
- [ ] Uji manual login/register/reset dengan akun test.
- [ ] Verifikasi isolasi data antar-user pada Data API.

**Gate:** Phase 2B belum boleh dinyatakan PASS sampai tiga item terakhir diverifikasi.
