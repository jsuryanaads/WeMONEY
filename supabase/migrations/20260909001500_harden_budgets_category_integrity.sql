-- Budget schema is already present in the production Supabase project.
-- This migration records the verified hardening applied to that existing table:
--   * RLS policies budgets_*_own already existed and are preserved.
--   * budgets.category_id references categories(id) with ON DELETE SET NULL.
--   * budget category must belong to the same user and be an active expense category.
--   * indexes support user/period reporting and duplicate-period protection.

create unique index if not exists budgets_user_category_period_start_uidx
  on public.budgets(user_id, category_id, period, start_date);

create index if not exists budgets_user_period_dates_idx
  on public.budgets(user_id, period, start_date, end_date);

create or replace function public.validate_budget_category_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.category_id is not null and not exists (
    select 1
    from public.categories c
    where c.id = new.category_id
      and c.user_id = new.user_id
      and c.type = 'expense'
      and c.is_active = true
  ) then
    raise exception 'Kategori budget tidak valid untuk pengguna ini.';
  end if;
  return new;
end;
$$;

drop trigger if exists budgets_validate_category_owner on public.budgets;
create trigger budgets_validate_category_owner
before insert or update on public.budgets
for each row execute function public.validate_budget_category_owner();

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();
