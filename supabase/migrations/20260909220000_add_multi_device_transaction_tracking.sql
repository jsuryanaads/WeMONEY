create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  device_name text not null,
  platform text,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, device_id)
);

alter table public.user_devices enable row level security;

create policy "user_devices_select_own" on public.user_devices for select using ((select auth.uid()) = user_id);
create policy "user_devices_insert_own" on public.user_devices for insert with check ((select auth.uid()) = user_id);
create policy "user_devices_update_own" on public.user_devices for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_devices_delete_own" on public.user_devices for delete using ((select auth.uid()) = user_id);

alter table public.transactions add column if not exists device_id text;
alter table public.transactions add column if not exists device_name text;
create index if not exists idx_transactions_user_device on public.transactions(user_id, device_id);

create or replace function public.touch_user_device(p_device_id text, p_device_name text, p_platform text default null, p_user_agent text default null)
returns public.user_devices
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result public.user_devices;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if coalesce(trim(p_device_id), '') = '' then raise exception 'Device ID is required'; end if;
  insert into public.user_devices(user_id, device_id, device_name, platform, user_agent, last_seen_at, updated_at)
  values(uid, trim(p_device_id), coalesce(nullif(trim(p_device_name), ''), 'Perangkat'), p_platform, p_user_agent, now(), now())
  on conflict(user_id, device_id) do update set
    device_name = excluded.device_name,
    platform = excluded.platform,
    user_agent = excluded.user_agent,
    last_seen_at = now(),
    updated_at = now()
  returning * into result;
  return result;
end;
$$;

grant execute on function public.touch_user_device(text,text,text,text) to authenticated;

create or replace function public.list_my_devices()
returns setof public.user_devices
language sql
security invoker
set search_path = public
as $$
  select * from public.user_devices where user_id = auth.uid() order by last_seen_at desc;
$$;

grant execute on function public.list_my_devices() to authenticated;
