create or replace function public.reset_my_financial_data()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  delete from public.transactions where user_id = uid;
  delete from public.transfers where user_id = uid;
  update public.wallets set initial_balance = 0, updated_at = now() where user_id = uid;
end;
$$;
revoke all on function public.reset_my_financial_data() from public, anon;
grant execute on function public.reset_my_financial_data() to authenticated;

create or replace function public.request_account_deletion()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  total bigint;
begin
  if uid is null then raise exception 'Not authenticated'; end if;

  select
    (select count(*) from public.transactions where user_id = uid) +
    (select count(*) from public.transfers where user_id = uid) +
    (select count(*) from public.wallets where user_id = uid) +
    (select count(*) from public.categories where user_id = uid) +
    (select count(*) from public.budgets where user_id = uid) +
    (select count(*) from public.receipts where user_id = uid) +
    (select count(*) from public.recurring_transactions where user_id = uid)
  into total;

  if total <> 0 then
    raise exception 'Akun belum kosong. Hapus seluruh transaksi, transfer, dompet, kategori, anggaran, struk, dan transaksi berulang sebelum mengajukan penghapusan akun.';
  end if;

  if exists (select 1 from public.account_deletion_requests where user_id = uid and status = 'pending') then
    raise exception 'Pengajuan penghapusan akun sudah menunggu persetujuan administrator.';
  end if;

  insert into public.account_deletion_requests(user_id, status)
  values (uid, 'pending')
  on conflict (user_id) do update set
    status = 'pending', requested_at = now(), reviewed_at = null, reviewed_by = null, admin_note = null;
end;
$$;
revoke all on function public.request_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;
