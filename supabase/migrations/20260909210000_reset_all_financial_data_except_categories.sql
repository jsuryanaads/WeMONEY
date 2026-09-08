-- We MONEY Reset Data policy:
-- Remove all user financial data while preserving categories and the account/profile.
-- Categories are configuration data and are intentionally NOT deleted.

create or replace function public.reset_my_financial_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Delete dependent financial records first.
  delete from public.receipts where user_id = uid;
  delete from public.recurring_transactions where user_id = uid;
  delete from public.budgets where user_id = uid;
  delete from public.transactions where user_id = uid;
  delete from public.transfers where user_id = uid;

  -- Reset means a clean financial workspace: remove all wallets too.
  -- Categories, profiles and auth.users are intentionally preserved.
  delete from public.wallets where user_id = uid;
end;
$$;

revoke all on function public.reset_my_financial_data() from public;
revoke all on function public.reset_my_financial_data() from anon;
grant execute on function public.reset_my_financial_data() to authenticated;
