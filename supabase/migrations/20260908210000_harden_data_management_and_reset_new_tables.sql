create or replace function public.reset_my_financial_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  delete from public.receipts where user_id = uid;
  delete from public.recurring_transactions where user_id = uid;
  delete from public.budgets where user_id = uid;
  delete from public.transactions where user_id = uid;
  delete from public.transfers where user_id = uid;
  update public.wallets set initial_balance = 0, updated_at = now() where user_id = uid;
end;
$$;
revoke all on function public.reset_my_financial_data() from public;
revoke all on function public.reset_my_financial_data() from anon;
grant execute on function public.reset_my_financial_data() to authenticated;

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
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
