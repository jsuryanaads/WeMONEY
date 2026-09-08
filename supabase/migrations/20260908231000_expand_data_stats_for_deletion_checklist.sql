drop function if exists public.get_my_data_stats();

create function public.get_my_data_stats()
returns table(
  transactions bigint,
  transfers bigint,
  categories bigint,
  wallets bigint,
  budgets bigint,
  receipts bigint,
  recurring_transactions bigint,
  last_activity timestamptz
)
language sql
security invoker
set search_path = public
as $$
select
  (select count(*) from public.transactions where user_id = auth.uid()),
  (select count(*) from public.transfers where user_id = auth.uid()),
  (select count(*) from public.categories where user_id = auth.uid()),
  (select count(*) from public.wallets where user_id = auth.uid()),
  (select count(*) from public.budgets where user_id = auth.uid()),
  (select count(*) from public.receipts where user_id = auth.uid()),
  (select count(*) from public.recurring_transactions where user_id = auth.uid()),
  greatest(
    (select max(updated_at) from public.transactions where user_id = auth.uid()),
    (select max(updated_at) from public.transfers where user_id = auth.uid()),
    (select max(updated_at) from public.wallets where user_id = auth.uid()),
    (select max(updated_at) from public.categories where user_id = auth.uid()),
    (select max(updated_at) from public.budgets where user_id = auth.uid()),
    (select max(updated_at) from public.receipts where user_id = auth.uid()),
    (select max(updated_at) from public.recurring_transactions where user_id = auth.uid())
  );
$$;
revoke all on function public.get_my_data_stats() from public, anon;
grant execute on function public.get_my_data_stats() to authenticated;
