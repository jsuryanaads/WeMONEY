-- Phase 2: atomically turn an obligation payment into a transaction and update the obligation.
alter table public.transactions drop constraint if exists transactions_source_check;
alter table public.transactions add constraint transactions_source_check
  check (source = any (array['manual'::text, 'quick_input'::text, 'receipt'::text, 'telegram'::text, 'obligation'::text]));

create table if not exists public.obligation_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  obligation_id uuid not null references public.obligations(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  amount numeric(18,2) not null check (amount > 0),
  payment_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists obligation_payments_user_idx on public.obligation_payments(user_id);
create index if not exists obligation_payments_obligation_idx on public.obligation_payments(obligation_id, payment_date desc);

alter table public.obligation_payments enable row level security;
create policy obligation_payments_select_own on public.obligation_payments for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.obligation_payments to authenticated;

create or replace function public.pay_obligation(
  p_obligation_id uuid,
  p_wallet_id uuid,
  p_amount numeric,
  p_payment_date date,
  p_category_id uuid default null,
  p_notes text default null,
  p_device_id text default null,
  p_device_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  ob public.obligations%rowtype;
  tx public.transactions%rowtype;
  payment_id uuid;
  tx_type text;
  remaining numeric(18,2);
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Nominal pembayaran harus lebih besar dari 0.'; end if;
  if p_payment_date is null then raise exception 'Tanggal pembayaran wajib diisi.'; end if;

  select * into ob
    from public.obligations
   where id = p_obligation_id and user_id = uid
   for update;

  if not found then raise exception 'Hutang/tagihan tidak ditemukan.'; end if;
  if ob.status in ('paid','cancelled') then raise exception 'Catatan sudah lunas atau dibatalkan.'; end if;

  remaining := ob.amount_total - ob.amount_paid;
  if p_amount > remaining then raise exception 'Pembayaran melebihi sisa kewajiban.'; end if;

  if ob.kind = 'receivable' then tx_type := 'income'; else tx_type := 'expense'; end if;

  if p_category_id is not null and not exists (
    select 1 from public.categories where id = p_category_id and user_id = uid
  ) then
    raise exception 'Kategori tidak valid.';
  end if;

  if not exists (
    select 1 from public.wallets
     where id = p_wallet_id and user_id = uid and is_active = true
  ) then
    raise exception 'Dompet pembayaran tidak valid atau sudah diarsipkan.';
  end if;

  insert into public.transactions (
    user_id, wallet_id, category_id, type, amount, transaction_date,
    description, notes, source, device_id, device_name
  ) values (
    uid, p_wallet_id, p_category_id, tx_type, p_amount, p_payment_date,
    case when ob.kind = 'receivable' then 'Penerimaan: ' else 'Pembayaran: ' end || ob.title,
    coalesce(p_notes, ob.notes),
    'obligation',
    p_device_id,
    p_device_name
  )
  returning * into tx;

  insert into public.obligation_payments (
    user_id, obligation_id, transaction_id, amount, payment_date
  ) values (
    uid, ob.id, tx.id, p_amount, p_payment_date
  )
  returning id into payment_id;

  update public.obligations
     set amount_paid = amount_paid + p_amount,
         status = case when amount_paid + p_amount >= amount_total then 'paid' else 'open' end,
         updated_at = now()
   where id = ob.id and user_id = uid;

  return jsonb_build_object(
    'payment_id', payment_id,
    'transaction_id', tx.id,
    'obligation_id', ob.id,
    'amount', p_amount,
    'status', case when ob.amount_paid + p_amount >= ob.amount_total then 'paid' else 'open' end
  );
end;
$$;

revoke all on function public.pay_obligation(uuid, uuid, numeric, date, uuid, text, text, text) from public;
revoke all on function public.pay_obligation(uuid, uuid, numeric, date, uuid, text, text, text) from anon;
grant execute on function public.pay_obligation(uuid, uuid, numeric, date, uuid, text, text, text) to authenticated;
