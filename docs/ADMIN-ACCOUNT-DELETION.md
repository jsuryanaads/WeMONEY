# Administrator — Penghapusan Akun WeMoney

## Prinsip
Penghapusan akun tidak tersedia sebagai aksi langsung bagi pengguna. Pengguna hanya dapat mengirim pengajuan setelah seluruh data keuangan miliknya benar-benar kosong.

Administrator tetap dikelola di **Supabase**, bukan sebagai role administrator di frontend WeMoney.

## Alur
1. Pengguna melakukan backup/export jika diperlukan.
2. Pengguna menghapus seluruh data keuangan.
3. WeMoney memanggil `request_account_deletion()`.
4. Database menghitung data pada transaksi, transfer, dompet, kategori, anggaran, struk, dan transaksi berulang.
5. Jika masih ada data, pengajuan ditolak.
6. Jika kosong, dibuat record `account_deletion_requests` dengan status `pending`.
7. Administrator memeriksa pengajuan dari Supabase.
8. Setelah pemeriksaan, administrator memproses penghapusan akun melalui mekanisme administrasi Supabase.

## Memeriksa pengajuan pending
Jalankan query berikut di SQL Editor Supabase:

```sql
select
  r.id,
  r.user_id,
  p.full_name,
  p.email,
  r.status,
  r.requested_at,
  r.reviewed_at,
  r.reviewed_by,
  r.admin_note
from public.account_deletion_requests r
left join public.profiles p on p.user_id = r.user_id
where r.status = 'pending'
order by r.requested_at asc;
```

## Catatan keamanan
- `delete_my_account()` tidak dapat dieksekusi oleh `anon` maupun `authenticated`.
- `request_account_deletion()` hanya dapat dipanggil oleh `authenticated`.
- RLS membatasi pengguna agar hanya dapat melihat pengajuan miliknya sendiri.
- Jangan memberikan `service_role` key ke frontend.
- Leaked Password Protection Supabase Auth tetap perlu diaktifkan dari konfigurasi Auth untuk menghilangkan advisory keamanan tersebut.
