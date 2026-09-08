insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];

create policy "Receipt objects are readable by owner"
on storage.objects for select to authenticated
using (bucket_id = 'receipts' and owner_id = (select auth.uid()::text));

create policy "Receipt objects are uploadable by owner"
on storage.objects for insert to authenticated
with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Receipt objects are deletable by owner"
on storage.objects for delete to authenticated
using (bucket_id = 'receipts' and owner_id = (select auth.uid()::text));
