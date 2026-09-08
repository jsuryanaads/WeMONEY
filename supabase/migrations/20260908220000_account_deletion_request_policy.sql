create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  admin_note text,
  unique (user_id)
);

alter table public.account_deletion_requests enable row level security;
drop policy if exists account_deletion_requests_select_own on public.account_deletion_requests;
drop policy if exists account_deletion_requests_insert_own on public.account_deletion_requests;
create policy account_deletion_requests_select_own on public.account_deletion_requests
  for select to authenticated using ((select auth.uid()) = user_id);
create policy account_deletion_requests_insert_own on public.account_deletion_requests
  for insert to authenticated with check ((select auth.uid()) = user_id and status = 'pending');
grant select, insert on public.account_deletion_requests to authenticated;

revoke all on function public.delete_my_account() from authenticated;

create or replace function public.request_account_deletion()
returns void
language plpgsql
security definer
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

revoke all on function public.request_account_deletion() from public;
grant execute on function public.request_account_deletion() to authenticated;
