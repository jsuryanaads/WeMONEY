-- Receipt files are transient and are never persisted in Supabase Storage.
alter table public.receipts drop column if exists storage_path;
