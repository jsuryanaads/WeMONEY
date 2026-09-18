create table if not exists public.telegram_conversation_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  telegram_chat_id text not null,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id, telegram_chat_id)
);

alter table public.telegram_conversation_state enable row level security;

create index if not exists idx_telegram_conversation_state_user_chat
  on public.telegram_conversation_state(user_id, telegram_chat_id);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='telegram_conversation_state'
      and policyname='telegram conversation owner read'
  ) then
    create policy "telegram conversation owner read"
      on public.telegram_conversation_state
      for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='telegram_conversation_state'
      and policyname='telegram conversation owner insert'
  ) then
    create policy "telegram conversation owner insert"
      on public.telegram_conversation_state
      for insert
      to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='telegram_conversation_state'
      and policyname='telegram conversation owner update'
  ) then
    create policy "telegram conversation owner update"
      on public.telegram_conversation_state
      for update
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='telegram_conversation_state'
      and policyname='telegram conversation owner delete'
  ) then
    create policy "telegram conversation owner delete"
      on public.telegram_conversation_state
      for delete
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$$;