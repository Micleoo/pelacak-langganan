-- Migration: Add multi-currency support
-- Menambahkan kolom currency ke expenses dan base_currency ke app_settings,
-- serta mengubah kolom amount menjadi numeric(12, 2) untuk mendukung desimal (USD/EUR/SGD).

-- 1. Tambah kolom currency ke expenses
alter table public.expenses
add column if not exists currency text not null default 'IDR'
check (currency in ('IDR', 'USD', 'EUR', 'SGD'));

-- 2. Ubah amount ke numeric(12, 2) agar mendukung nominal desimal (mis. $9.99)
alter table public.expenses
alter column amount type numeric(12, 2);

-- 3. Tambah kolom base_currency ke app_settings
alter table public.app_settings
add column if not exists base_currency text not null default 'IDR'
check (base_currency in ('IDR', 'USD', 'EUR', 'SGD'));

-- 4. Komentar untuk dokumentasi
comment on column public.expenses.currency is 'Mata uang biaya berulang (IDR, USD, EUR, SGD)';
comment on column public.app_settings.base_currency is 'Mata uang dasar untuk konversi total dan rincian (IDR, USD, EUR, SGD)';