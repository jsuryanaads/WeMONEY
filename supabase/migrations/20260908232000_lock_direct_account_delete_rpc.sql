create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if exists (
    select 1 from public.account_deletion_requests
    where user_id = uid and status = 'pending'
  ) then
    raise exception 'Penghapusan akun harus diproses administrator.';
  end if;
  raise exception 'Penghapusan akun hanya dapat dilakukan oleh administrator.';
end;
$$;
revoke all on function public.delete_my_account() from public, anon, authenticated;
