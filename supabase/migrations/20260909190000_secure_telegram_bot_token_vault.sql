-- We MONEY: secure Telegram bot token configuration via Supabase Vault.
-- The token is never exposed to the browser after storage.

create or replace function public.set_telegram_bot_token(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public, vault
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  p_token := btrim(coalesce(p_token, ''));
  if p_token = '' then raise exception 'Bot Token wajib diisi'; end if;
  if length(p_token) < 20 or p_token !~ '^[0-9]+:[A-Za-z0-9_-]+$' then raise exception 'Format Bot Token Telegram tidak valid'; end if;
  select id into v_id from vault.secrets where name = 'wemoney_telegram_bot_token' limit 1;
  if v_id is null then
    perform vault.create_secret(p_token, 'wemoney_telegram_bot_token', 'We MONEY Telegram Bot Token');
  else
    perform vault.update_secret(v_id, p_token, 'wemoney_telegram_bot_token', 'We MONEY Telegram Bot Token', null);
  end if;
  return true;
end;
$$;

create or replace function public.has_telegram_bot_token()
returns boolean
language sql
security definer
set search_path = public, vault
as $$
  select exists(select 1 from vault.secrets where name = 'wemoney_telegram_bot_token');
$$;

create or replace function public.get_telegram_bot_token()
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'wemoney_telegram_bot_token' limit 1;
$$;

revoke all on function public.get_telegram_bot_token() from public, anon, authenticated;
grant execute on function public.get_telegram_bot_token() to service_role;
revoke all on function public.set_telegram_bot_token(text) from public, anon;
grant execute on function public.set_telegram_bot_token(text) to authenticated;
grant execute on function public.has_telegram_bot_token() to authenticated;
