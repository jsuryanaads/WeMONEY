-- We MONEY V1.6.1 security and performance hardening
create index if not exists obligation_payments_transaction_idx on public.obligation_payments(transaction_id);

drop policy if exists telegram_link_codes_no_client_access on public.telegram_link_codes;
create policy telegram_link_codes_no_client_access on public.telegram_link_codes for all to authenticated using (false) with check (false);
drop policy if exists telegram_pending_transactions_no_client_access on public.telegram_pending_transactions;
create policy telegram_pending_transactions_no_client_access on public.telegram_pending_transactions for all to authenticated using (false) with check (false);
drop policy if exists telegram_webhook_updates_no_client_access on public.telegram_webhook_updates;
create policy telegram_webhook_updates_no_client_access on public.telegram_webhook_updates for all to authenticated using (false) with check (false);
revoke all on table public.telegram_link_codes from anon, authenticated;
revoke all on table public.telegram_pending_transactions from anon, authenticated;
revoke all on table public.telegram_webhook_updates from anon, authenticated;

drop policy if exists telegram_connections_select_own on public.telegram_connections;
create policy telegram_connections_select_own on public.telegram_connections for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists telegram_connections_delete_own on public.telegram_connections;
create policy telegram_connections_delete_own on public.telegram_connections for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists budget_plans_select_own on public.budget_plans;
create policy budget_plans_select_own on public.budget_plans for select to public using ((select auth.uid()) = user_id);
drop policy if exists budget_plans_insert_own on public.budget_plans;
create policy budget_plans_insert_own on public.budget_plans for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists budget_plans_update_own on public.budget_plans;
create policy budget_plans_update_own on public.budget_plans for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists budget_plans_delete_own on public.budget_plans;
create policy budget_plans_delete_own on public.budget_plans for delete to public using ((select auth.uid()) = user_id);

drop policy if exists budget_allocations_select_own on public.budget_allocations;
create policy budget_allocations_select_own on public.budget_allocations for select to public using ((select auth.uid()) = user_id);
drop policy if exists budget_allocations_insert_own on public.budget_allocations;
create policy budget_allocations_insert_own on public.budget_allocations for insert to public with check ((select auth.uid()) = user_id and exists (select 1 from public.budget_plans p where p.id = budget_allocations.plan_id and p.user_id = (select auth.uid())));
drop policy if exists budget_allocations_update_own on public.budget_allocations;
create policy budget_allocations_update_own on public.budget_allocations for update to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and exists (select 1 from public.budget_plans p where p.id = budget_allocations.plan_id and p.user_id = (select auth.uid())));
drop policy if exists budget_allocations_delete_own on public.budget_allocations;
create policy budget_allocations_delete_own on public.budget_allocations for delete to public using ((select auth.uid()) = user_id);

create or replace function public.delete_my_transaction(p_transaction_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); receipt uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select receipt_id into receipt from public.transactions where id = p_transaction_id and user_id = uid for update;
  if not found then raise exception 'Transaksi tidak ditemukan.'; end if;
  delete from public.transactions where id = p_transaction_id and user_id = uid;
  if receipt is not null then delete from public.receipts where id = receipt and user_id = uid; end if;
end; $$;
revoke all on function public.delete_my_transaction(uuid) from public, anon;
grant execute on function public.delete_my_transaction(uuid) to authenticated;
