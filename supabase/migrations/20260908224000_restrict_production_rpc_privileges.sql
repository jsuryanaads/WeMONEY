revoke execute on function public.get_my_data_stats() from public, anon;
grant execute on function public.get_my_data_stats() to authenticated;

revoke execute on function public.delete_my_account() from public, anon, authenticated;

revoke execute on function public.request_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;

revoke execute on function public.reset_my_financial_data() from public, anon;
grant execute on function public.reset_my_financial_data() to authenticated;
