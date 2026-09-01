-- Migration: Status Paused & Overdue
-- Menambahkan status 'paused' dan 'overdue' ke tabel expenses, plus kolom last_paid_date

-- 1. Update CHECK constraint pada expenses.status
-- Hanya bisa menambah nilai ke CHECK constraint, tidak bisa remove - jadi drop & recreate
alter table public.expenses drop constraint if exists expenses_status_check;
alter table public.expenses add constraint expenses_status_check
  check (status in ('active', 'cancelled', 'paused', 'overdue'));

-- 2. Tambah kolom last_paid_date untuk tracking kapan overdue dibayar
alter table public.expenses add column if not exists last_paid_date date null;

-- 3. Index untuk query overdue yang efisien
create index if not exists expenses_status_idx on public.expenses(status);
create index if not exists expenses_last_paid_date_idx on public.expenses(last_paid_date);

-- 4. Komentar untuk dokumentasi
comment on column public.expenses.last_paid_date is 'Tanggal terakhir biaya overdue dibayar (di-set saat user klik "Mark as Paid")';
comment on constraint expenses_status_check on public.expenses is 'Status: active, cancelled, paused, overdue';