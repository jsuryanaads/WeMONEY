create or replace function public.reset_my_financial_data()
returns void
language plpgsql
security definer
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
revoke all on function public.reset_my_financial_data() from public;
grant execute on function public.reset_my_financial_data() to authenticated;

create or replace function public.get_my_data_stats()
returns table(transactions bigint, transfers bigint, categories bigint, wallets bigint, last_activity timestamptz)
language sql
security invoker
set search_path = public
as $$
select
  (select count(*) from public.transactions where user_id = auth.uid()),
  (select count(*) from public.transfers where user_id = auth.uid()),
  (select count(*) from public.categories where user_id = auth.uid()),
  (select count(*) from public.wallets where user_id = auth.uid()),
  greatest(
    (select max(updated_at) from public.transactions where user_id = auth.uid()),
    (select max(updated_at) from public.transfers where user_id = auth.uid()),
    (select max(updated_at) from public.wallets where user_id = auth.uid()),
    (select max(updated_at) from public.categories where user_id = auth.uid())
  );
$$;
grant execute on function public.get_my_data_stats() to authenticated;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  delete from auth.users where id = uid;
end;
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
