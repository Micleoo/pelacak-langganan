-- Migration: payment_history table for analytics/trend feature
-- Stores payment records to compute monthly trends per category

create extension if not exists pgcrypto;

-- Table: payment_history
create table if not exists public.payment_history (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  amount_paid integer not null check (amount_paid > 0),
  currency text not null default 'IDR' check (currency in ('IDR', 'USD', 'EUR', 'SGD')),
  paid_at date not null default now(),
  month_key text not null,  -- 'YYYY-MM' for easy grouping
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists payment_history_expense_id_idx on public.payment_history(expense_id);
create index if not exists payment_history_month_key_idx on public.payment_history(month_key);

-- RLS Policies (Single-user model: sama seperti tabel expenses dan categories)
alter table public.payment_history enable row level security;

create policy "Allow all access to payment_history"
  on public.payment_history
  for all
  using (true)
  with check (true);

-- Comments
comment on table public.payment_history is 'Riwayat pembayaran biaya berulang untuk analisis tren bulanan';
comment on column public.payment_history.amount_paid is 'Nominal yang dibayar (bisa beda dari expense.amount untuk partial)';
comment on column public.payment_history.currency is 'Mata uang saat pembayaran';
comment on column public.payment_history.paid_at is 'Tanggal pembayaran';
comment on column public.payment_history.month_key is 'Kunci bulan YYYY-MM untuk grouping cepat';