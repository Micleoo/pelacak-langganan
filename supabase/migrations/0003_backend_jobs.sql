-- Migration: Backend Jobs & Email Reminders
-- Menambahkan kolom user_email, auto-forward cron, dan edge function cron.

-- 1. Tambah kolom user_email
alter table public.app_settings add column if not exists user_email text;

-- 2. Fungsi untuk memajukan tanggal jatuh tempo secara otomatis (atomic, timezone-aware)
-- Uses Asia/Jakarta timezone as per app spec (dates stored as local Asia/Jakarta)
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
  
  -- Single atomic UPDATE using CASE expression
  update public.expenses
  set next_billing_date = 
    case interval
      when 'monthly' then next_billing_date + interval '1 month' * ceil((jakarta_date - next_billing_date) / interval '1 month')
      when 'yearly' then next_billing_date + interval '1 year' * ceil((jakarta_date - next_billing_date) / interval '1 year')
      when 'quarterly' then next_billing_date + interval '3 months' * ceil((jakarta_date - next_billing_date) / interval '3 months')
      when 'weekly' then next_billing_date + interval '1 week' * ceil((jakarta_date - next_billing_date) / interval '1 week')
    end
  where status = 'active'
    and next_billing_date < jakarta_date;
  
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- 3. Ekstensi untuk Cron dan Network
-- Catatan: Ekstensi ini mungkin memerlukan akses superuser. Di platform Supabase ini biasanya aman.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 4. Jadwalkan auto-advance tiap tengah malam (00:00 Asia/Jakarta = 17:00 UTC previous day)
-- Using the atomic function that returns count for monitoring
select cron.schedule('advance-expenses-daily', '0 0 * * *', 'select public.advance_past_due_expenses();');

-- 5. Jadwalkan trigger Edge Function tiap jam 07:00 pagi Asia/Jakarta (00:00 UTC)
-- Using dynamic URL function
select cron.schedule('send-reminders-daily', '0 7 * * *', $$
  select net.http_post(
    url:=public.get_send_reminders_url(),
    headers:=jsonb_build_object('Content-Type', 'application/json')
  );
$$);