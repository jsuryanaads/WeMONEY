drop policy if exists "telegram conversation owner write" on public.telegram_conversation_state;

create policy "telegram conversation owner insert"
  on public.telegram_conversation_state
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "telegram conversation owner update"
  on public.telegram_conversation_state
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "telegram conversation owner delete"
  on public.telegram_conversation_state
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);