create or replace function public.revoke_my_device(p_device_id text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if nullif(trim(p_device_id), '') is null then raise exception 'Device ID is required'; end if;
  delete from public.user_devices
  where user_id = (select auth.uid())
    and device_id = trim(p_device_id);
end;
$$;

revoke all on function public.revoke_my_device(text) from public, anon;
grant execute on function public.revoke_my_device(text) to authenticated;
