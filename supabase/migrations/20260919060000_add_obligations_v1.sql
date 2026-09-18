create table if not exists public.obligations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('debt','receivable','bill')),
  title text not null,
  counterparty text,
  amount_total numeric(18,2) not null check (amount_total > 0),
  amount_paid numeric(18,2) not null default 0 check (amount_paid >= 0 and amount_paid <= amount_total),
  due_date date,
  status text not null default 'open' check (status in ('open','paid','cancelled')),
  is_recurring boolean not null default false,
  recurrence text check (recurrence is null or recurrence in ('monthly','yearly')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint obligations_recurring_rule check ((is_recurring = false and recurrence is null) or (is_recurring = true and recurrence is not null))
);

create index if not exists obligations_user_kind_due_idx
  on public.obligations(user_id, kind, due_date);

create index if not exists obligations_user_status_idx
  on public.obligations(user_id, status);

alter table public.obligations enable row level security;

drop policy if exists obligations_select_own on public.obligations;
drop policy if exists obligations_insert_own on public.obligations;
drop policy if exists obligations_update_own on public.obligations;
drop policy if exists obligations_delete_own on public.obligations;

create policy obligations_select_own on public.obligations
  for select to authenticated using ((select auth.uid()) = user_id);

create policy obligations_insert_own on public.obligations
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy obligations_update_own on public.obligations
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy obligations_delete_own on public.obligations
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.obligations to authenticated;

drop trigger if exists obligations_set_updated_at on public.obligations;
create trigger obligations_set_updated_at
before update on public.obligations
for each row execute function public.set_updated_at();

-- Keep the existing reset workflow complete when obligation records exist.
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

  delete from public.receipts where user_id = uid;
  delete from public.recurring_transactions where user_id = uid;
  delete from public.obligations where user_id = uid;
  delete from public.budgets where user_id = uid;
  delete from public.transactions where user_id = uid;
  delete from public.transfers where user_id = uid;
  delete from public.wallets where user_id = uid;
end;
$$;

revoke all on function public.reset_my_financial_data() from public;
revoke all on function public.reset_my_financial_data() from anon;
grant execute on function public.reset_my_financial_data() to authenticated;
