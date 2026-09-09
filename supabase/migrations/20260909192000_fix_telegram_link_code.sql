-- We MONEY: fix Telegram link-code generation.
-- Qualify table columns to avoid PL/pgSQL output-variable ambiguity and
-- qualify pgcrypto because the extension is installed in the extensions schema.

create or replace function public.create_telegram_link_code()
returns table(code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_exp timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.telegram_link_codes tlc
  where tlc.user_id = auth.uid()
     or tlc.expires_at < now();

  loop
    v_code := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 10));
    exit when not exists (
      select 1
      from public.telegram_link_codes existing
      where existing.code = v_code
    );
  end loop;

  v_exp := now() + interval '15 minutes';

  insert into public.telegram_link_codes(code, user_id, expires_at)
  values (v_code, auth.uid(), v_exp);

  return query select v_code, v_exp;
end;
$$;

revoke all on function public.create_telegram_link_code() from public, anon;
grant execute on function public.create_telegram_link_code() to authenticated;
