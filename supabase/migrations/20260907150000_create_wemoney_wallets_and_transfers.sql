create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'cash' check (type in ('cash','bank','ewallet','credit_card','other')),
  initial_balance numeric(18,2) not null default 0 check (initial_balance >= 0),
  icon text,
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);

create index wallets_user_id_idx on public.wallets(user_id);

alter table public.wallets enable row level security;
create policy wallets_select_own on public.wallets for select to authenticated using ((select auth.uid()) = user_id);
create policy wallets_insert_own on public.wallets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy wallets_update_own on public.wallets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy wallets_delete_own on public.wallets for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.wallets to authenticated;

alter table public.transactions add column wallet_id uuid;

alter table public.transactions
  add constraint transactions_wallet_owner_fkey
  foreign key (wallet_id, user_id)
  references public.wallets(id, user_id)
  on delete restrict;

create index transactions_wallet_id_idx on public.transactions(wallet_id);

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_wallet_id uuid not null,
  destination_wallet_id uuid not null,
  amount numeric(18,2) not null check (amount > 0),
  transfer_date date not null default current_date,
  description text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_wallet_id <> destination_wallet_id),
  unique (id, user_id),
  foreign key (source_wallet_id, user_id) references public.wallets(id, user_id) on delete restrict,
  foreign key (destination_wallet_id, user_id) references public.wallets(id, user_id) on delete restrict
);

create index transfers_user_id_date_idx on public.transfers(user_id, transfer_date desc);
create index transfers_source_wallet_idx on public.transfers(source_wallet_id);
create index transfers_destination_wallet_idx on public.transfers(destination_wallet_id);

alter table public.transfers enable row level security;
create policy transfers_select_own on public.transfers for select to authenticated using ((select auth.uid()) = user_id);
create policy transfers_insert_own on public.transfers for insert to authenticated with check ((select auth.uid()) = user_id);
create policy transfers_update_own on public.transfers for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy transfers_delete_own on public.transfers for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.transfers to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger wallets_set_updated_at before update on public.wallets for each row execute function public.set_updated_at();
create trigger transfers_set_updated_at before update on public.transfers for each row execute function public.set_updated_at();
