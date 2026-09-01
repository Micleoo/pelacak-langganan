-- Migration: Update Advance Cron untuk Status Overdue
-- Mengubah behavior advance_past_due_expenses():
-- Sebelum: auto-advance next_billing_date untuk expense active yang lewat
-- Sesudah: set status = 'overdue' untuk expense active yang lewat (next_billing_date < today)
-- Auto-advance hanya terjadi via user action "Mark as Paid" di UI

-- 1. Drop cron job lama
select cron.unschedule('advance-expenses-daily') where exists (select 1 from cron.job where jobname = 'advance-expenses-daily');

-- 2. Update fungsi advance_past_due_expenses()
create or replace function public.advance_past_due_expenses()
returns integer
language plpgsql
security definer
as $$
declare
  updated_count integer;
  jakarta_date date;
begin
  -- Get current date in Asia/Jakarta timezone
  jakarta_date := (current_timestamp at time zone 'Asia/Jakarta')::date;
  
  -- Update expense active yang next_billing_date < today menjadi status 'overdue'
  -- last_paid_date tetap NULL (diisi saat user klik "Mark as Paid")
  update public.expenses
  set status = 'overdue',
      updated_at = now()
  where status = 'active'
    and next_billing_date < jakarta_date;
  
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- 3. Jadwalkan kembali tiap tengah malam (00:00 Asia/Jakarta = 17:00 UTC previous day)
select cron.schedule('advance-expenses-daily', '0 0 * * *', 'select public.advance_past_due_expenses();');

-- 4. Komentar untuk dokumentasi
comment on function public.advance_past_due_expenses() is 'Set status=overdue untuk expense active yang next_billing_date < today (Asia/Jakarta). Auto-advance ke next cycle hanya via user action "Mark as Paid".';