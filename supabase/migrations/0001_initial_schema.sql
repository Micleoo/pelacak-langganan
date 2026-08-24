-- Schema Pelacak Langganan (ADR-0001, amandemen Supabase)
-- Konvensi: tabel plural, snake_case, PK uuid via gen_random_uuid(),
-- enum sebagai text + CHECK. Eksekusi via Supabase SQL Editor / CLI.

create extension if not exists pgcrypto;

-- Tabel 1: categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Tabel 2: expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount integer not null check (amount >= 0),
  interval text not null check (interval in ('monthly', 'yearly', 'quarterly', 'weekly')),
  category_id uuid references public.categories(id) on delete set null,
  status text not null check (status in ('active', 'cancelled')) default 'active',
  next_billing_date date not null,
  notify_days_before integer check (notify_days_before is null or notify_days_before between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_category_id_idx on public.expenses(category_id);
create index if not exists expenses_next_billing_date_idx on public.expenses(next_billing_date);

-- Tabel 3: app_settings (singleton, single-user)
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  default_notify_days_before integer not null default 3 check (default_notify_days_before between 1 and 7),
  email_enabled boolean not null default false,
  in_app_enabled boolean not null default true,
  user_email text,
  updated_at timestamptz not null default now()
);

-- Pastikan tepat satu baris default di app_settings
insert into public.app_settings (default_notify_days_before, email_enabled, in_app_enabled)
select 3, false, true
where not exists (select 1 from public.app_settings);
