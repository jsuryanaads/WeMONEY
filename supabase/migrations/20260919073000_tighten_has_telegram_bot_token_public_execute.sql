-- Defense-in-depth: SECURITY DEFINER helper must not be callable through PUBLIC.
revoke execute on function public.has_telegram_bot_token() from public;
