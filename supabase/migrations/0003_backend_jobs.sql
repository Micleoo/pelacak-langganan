-- Migration: Backend Jobs & Email Reminders
-- Menambahkan kolom user_email, auto-forward cron, dan edge function cron.

-- 1. Tambah kolom user_email
alter table public.app_settings add column if not exists user_email text;

-- 2. Fungsi untuk memajukan tanggal jatuh tempo secara otomatis
create or replace function public.advance_past_due_expenses()
returns void
language plpgsql
security definer
as $$
declare
  r record;
  new_date date;
begin
  for r in select id, interval, next_billing_date from public.expenses where status = 'active' and next_billing_date < current_date loop
    new_date := r.next_billing_date;
    while new_date < current_date loop
      if r.interval = 'monthly' then
        new_date := new_date + interval '1 month';
      elsif r.interval = 'yearly' then
        new_date := new_date + interval '1 year';
      elsif r.interval = 'quarterly' then
        new_date := new_date + interval '3 months';
      elsif r.interval = 'weekly' then
        new_date := new_date + interval '1 week';
      end if;
    end loop;
    update public.expenses set next_billing_date = new_date where id = r.id;
  end loop;
end;
$$;

-- 3. Ekstensi untuk Cron dan Network
-- Catatan: Ekstensi ini mungkin memerlukan akses superuser. Di platform Supabase ini biasanya aman.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 4. Jadwalkan auto-advance tiap tengah malam (00:00)
select cron.schedule('advance-expenses-daily', '0 0 * * *', 'select public.advance_past_due_expenses();');

-- 5. Jadwalkan trigger Edge Function tiap jam 07:00 pagi
-- URL di bawah diarahkan ke localhost untuk development.
-- Untuk production, ubah URL ini ke: https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders
select cron.schedule('send-reminders-daily', '0 7 * * *', $$
  select net.http_post(
    url:='https://ohjiqunmvqqqvypwftjk.supabase.co/functions/v1/send-reminders',
    headers:=jsonb_build_object('Content-Type', 'application/json')
  );
$$);
