create or replace function public.telegram_create_transaction(
  p_chat_id text,
  p_type text,
  p_amount numeric,
  p_description text,
  p_date date default current_date,
  p_wallet_id uuid default null,
  p_category_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_wallet uuid;
  v_category uuid;
  v_tx uuid;
begin
  select user_id into v_user
  from public.telegram_connections
  where telegram_chat_id = p_chat_id and status = 'active';
  if v_user is null then raise exception 'Telegram belum terhubung'; end if;
  if p_type not in ('income','expense') or p_amount <= 0 or length(trim(p_description)) = 0 then
    raise exception 'Data transaksi tidak valid';
  end if;

  if p_wallet_id is not null then
    select id into v_wallet from public.wallets
    where id = p_wallet_id and user_id = v_user and is_active = true;
  else
    select id into v_wallet from public.wallets
    where user_id = v_user and is_active = true order by created_at asc limit 1;
  end if;
  if v_wallet is null then raise exception 'Dompet tidak valid atau belum ada dompet aktif'; end if;

  if p_category_id is not null then
    select id into v_category from public.categories
    where id = p_category_id and user_id = v_user and is_active = true and type = p_type;
  else
    select id into v_category from public.categories
    where user_id = v_user and is_active = true and type = p_type order by created_at asc limit 1;
  end if;
  if v_category is null then raise exception 'Kategori tidak valid atau belum ada kategori aktif untuk tipe transaksi ini'; end if;

  insert into public.transactions(user_id,wallet_id,category_id,type,amount,description,transaction_date,source)
  values(v_user,v_wallet,v_category,p_type,p_amount,trim(p_description),coalesce(p_date,current_date),'telegram')
  returning id into v_tx;

  return jsonb_build_object('id',v_tx,'user_id',v_user,'wallet_id',v_wallet,'category_id',v_category,'type',p_type,'amount',p_amount,'description',trim(p_description),'transaction_date',coalesce(p_date,current_date));
end;
$$;

revoke all on function public.telegram_create_transaction(text,text,numeric,text,date,uuid,uuid) from public, anon, authenticated;
grant execute on function public.telegram_create_transaction(text,text,numeric,text,date,uuid,uuid) to service_role;
