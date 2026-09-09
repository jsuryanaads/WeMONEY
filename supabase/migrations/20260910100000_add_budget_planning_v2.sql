create table if not exists public.budget_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Rencana Bulanan',
  period_start date not null default date_trunc('month', current_date)::date,
  income_amount numeric not null default 0,
  obligation_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_plans_income_nonnegative check (income_amount >= 0),
  constraint budget_plans_obligation_nonnegative check (obligation_amount >= 0),
  constraint budget_plans_obligation_not_over_income check (obligation_amount <= income_amount)
);
create unique index if not exists budget_plans_user_period_uidx on public.budget_plans(user_id, period_start);
create index if not exists budget_plans_user_idx on public.budget_plans(user_id);
create table if not exists public.budget_allocations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.budget_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  group_key text not null,
  name text not null,
  percentage numeric not null default 0,
  amount numeric not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_allocations_percentage_nonnegative check (percentage >= 0 and percentage <= 100),
  constraint budget_allocations_amount_nonnegative check (amount >= 0),
  constraint budget_allocations_group_key check (group_key in ('needs','savings','emergency','lifestyle','flexible'))
);
create unique index if not exists budget_allocations_plan_group_uidx on public.budget_allocations(plan_id, group_key);
create index if not exists budget_allocations_user_idx on public.budget_allocations(user_id);
alter table public.budget_plans enable row level security;
alter table public.budget_allocations enable row level security;
drop policy if exists budget_plans_select_own on public.budget_plans;
drop policy if exists budget_plans_insert_own on public.budget_plans;
drop policy if exists budget_plans_update_own on public.budget_plans;
drop policy if exists budget_plans_delete_own on public.budget_plans;
create policy budget_plans_select_own on public.budget_plans for select using (auth.uid() = user_id);
create policy budget_plans_insert_own on public.budget_plans for insert with check (auth.uid() = user_id);
create policy budget_plans_update_own on public.budget_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy budget_plans_delete_own on public.budget_plans for delete using (auth.uid() = user_id);
drop policy if exists budget_allocations_select_own on public.budget_allocations;
drop policy if exists budget_allocations_insert_own on public.budget_allocations;
drop policy if exists budget_allocations_update_own on public.budget_allocations;
drop policy if exists budget_allocations_delete_own on public.budget_allocations;
create policy budget_allocations_select_own on public.budget_allocations for select using (auth.uid() = user_id);
create policy budget_allocations_insert_own on public.budget_allocations for insert with check (auth.uid() = user_id and exists (select 1 from public.budget_plans p where p.id = plan_id and p.user_id = auth.uid()));
create policy budget_allocations_update_own on public.budget_allocations for update using (auth.uid() = user_id) with check (auth.uid() = user_id and exists (select 1 from public.budget_plans p where p.id = plan_id and p.user_id = auth.uid()));
create policy budget_allocations_delete_own on public.budget_allocations for delete using (auth.uid() = user_id);
create or replace function public.set_budget_planning_updated_at() returns trigger language plpgsql security invoker set search_path = public as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists budget_plans_updated_at on public.budget_plans;
create trigger budget_plans_updated_at before update on public.budget_plans for each row execute function public.set_budget_planning_updated_at();
drop trigger if exists budget_allocations_updated_at on public.budget_allocations;
create trigger budget_allocations_updated_at before update on public.budget_allocations for each row execute function public.set_budget_planning_updated_at();
