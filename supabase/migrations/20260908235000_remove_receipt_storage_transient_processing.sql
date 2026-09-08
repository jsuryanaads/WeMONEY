-- Receipt files are transient and are no longer persisted in Supabase Storage.
-- Keep only structured OCR/receipt data in public.receipts.

drop policy if exists "Receipt objects are readable by owner" on storage.objects;
drop policy if exists "Receipt objects are uploadable by owner" on storage.objects;
drop policy if exists "Receipt objects are deletable by owner" on storage.objects;

alter table public.receipts drop column if exists storage_path;
