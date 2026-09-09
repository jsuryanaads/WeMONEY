create or replace function public.create_quick_transactions(p_items jsonb)
returns jsonb
language plpgsql
set search_path = public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_count integer := 0;
  v_id uuid;
  v_amount numeric;
  v_type text;
  v_wallet_id uuid;
  v_category_id uuid;
  v_date date;
  v_description text;
  v_notes text;
  v_source text;
  v_device_id text;
  v_device_name text;
  v_result jsonb := '[]'::jsonb;
begin
  if v_user_id is null then raise exception 'Sesi pengguna tidak ditemukan.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Belum ada transaksi untuk disimpan.'; end if;
  if jsonb_array_length(p_items) > 100 then raise exception 'Maksimal 100 transaksi per sekali simpan.'; end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_amount := (v_item->>'amount')::numeric;
    v_type := v_item->>'type';
    v_wallet_id := (v_item->>'wallet_id')::uuid;
    v_category_id := nullif(v_item->>'category_id','')::uuid;
    v_date := (v_item->>'transaction_date')::date;
    v_description := nullif(trim(v_item->>'description'),'');
    v_notes := nullif(trim(v_item->>'notes'),'');
    v_source := coalesce(nullif(v_item->>'source',''),'quick_input');
    v_device_id := nullif(v_item->>'device_id','');
    v_device_name := nullif(v_item->>'device_name','');

    if v_amount is null or v_amount = 'NaN'::numeric or v_amount <= 0 then raise exception 'Nominal transaksi tidak valid.'; end if;
    if v_type not in ('income','expense') then raise exception 'Jenis transaksi tidak valid.'; end if;
    if v_wallet_id is null or not exists (select 1 from public.wallets w where w.id=v_wallet_id and w.user_id=v_user_id and w.is_active=true) then raise exception 'Dompet transaksi tidak valid.'; end if;
    if v_category_id is null or not exists (select 1 from public.categories c where c.id=v_category_id and c.user_id=v_user_id and c.is_active=true and c.type=v_type) then raise exception 'Kategori transaksi tidak valid.'; end if;
    if v_date is null then raise exception 'Tanggal transaksi wajib diisi.'; end if;

    insert into public.transactions (user_id,wallet_id,category_id,type,amount,transaction_date,description,notes,source,device_id,device_name)
    values (v_user_id,v_wallet_id,v_category_id,v_type,v_amount,v_date,v_description,v_notes,v_source,v_device_id,v_device_name)
    returning id into v_id;
    v_count := v_count + 1;
    v_result := v_result || jsonb_build_array(v_id);
  end loop;
  return jsonb_build_object('count',v_count,'ids',v_result);
end;
$function$;
