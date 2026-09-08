create index if not exists idx_account_deletion_requests_reviewed_by on public.account_deletion_requests(reviewed_by);
create index if not exists idx_transactions_category_user on public.transactions(category_id, user_id);
