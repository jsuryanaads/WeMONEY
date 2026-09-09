create or replace function public.save_budget_plan(p_period_start date, p_income numeric, p_obligation numeric, p_allocations jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan public.budget_plans;
  v_remaining numeric;
  v_total_pct numeric;
  v_total_amount numeric;
  v_rows jsonb;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if p_income is null or p_income < 0 then raise exception 'Pendapatan tidak valid.'; end if;
  if p_obligation is null or p_obligation < 0 or p_obligation > p_income then raise exception 'Kewajiban tidak boleh melebihi pendapatan.'; end if;
  if jsonb_typeof(p_allocations) <> 'array' or jsonb_array_length(p_allocations) = 0 then raise exception 'Alokasi wajib diisi.'; end if;
  v_remaining := p_income - p_obligation;
  select coalesce(sum((x->>'percentage')::numeric),0), coalesce(sum((x->>'amount')::numeric),0)
    into v_total_pct, v_total_amount
  from jsonb_array_elements(p_allocations) x;
  if exists (select 1 from jsonb_array_elements(p_allocations) x where coalesce((x->>'percentage')::numeric,-1) < 0 or coalesce((x->>'percentage')::numeric,-1) > 100 or coalesce((x->>'amount')::numeric,-1) < 0) then raise exception 'Nilai alokasi tidak valid.'; end if;
  if (select count(*) from jsonb_array_elements(p_allocations) x) <> (select count(distinct x->>'group_key') from jsonb_array_elements(p_allocations) x) then raise exception 'Kelompok alokasi duplikat.'; end if;
  if v_remaining > 0 and abs(v_total_pct - 100) > 0.01 then raise exception 'Total alokasi harus 100%%. Saat ini %.1f%%.', v_total_pct; end if;
  if abs(v_total_amount - v_remaining) > 1 then raise exception 'Total nominal alokasi harus sama dengan sisa uang.'; end if;
  insert into public.budget_plans(user_id,name,period_start,income_amount,obligation_amount)
  values(v_user,'Rencana Bulanan',p_period_start,p_income,p_obligation)
  on conflict (user_id,period_start) do update set income_amount=excluded.income_amount, obligation_amount=excluded.obligation_amount, updated_at=now()
  returning * into v_plan;
  delete from public.budget_allocations where plan_id=v_plan.id and user_id=v_user;
  insert into public.budget_allocations(plan_id,user_id,group_key,name,percentage,amount,sort_order)
  select v_plan.id,v_user,x->>'group_key',x->>'name',(x->>'percentage')::numeric,(x->>'amount')::numeric,(x->>'sort_order')::integer
  from jsonb_array_elements(p_allocations) x;
  select jsonb_agg(to_jsonb(a) order by a.sort_order) into v_rows from public.budget_allocations a where a.plan_id=v_plan.id and a.user_id=v_user;
  return jsonb_build_object('plan',to_jsonb(v_plan),'allocations',coalesce(v_rows,'[]'::jsonb));
end; $$;
revoke all on function public.save_budget_plan(date,numeric,numeric,jsonb) from public, anon;
grant execute on function public.save_budget_plan(date,numeric,numeric,jsonb) to authenticated;
