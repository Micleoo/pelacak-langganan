-- Migration 0014: Add user_id to tables, enable Row Level Security (RLS), and handle user onboarding
-- Supports Multi-User & Authentication via Supabase Auth

-- 1. Add user_id column with foreign key to auth.users to all entities
alter table public.expenses 
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

alter table public.categories 
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

alter table public.payment_history 
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

alter table public.app_settings 
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

-- 2. Migrasikan seluruh data dummy/lama ke akun 11p221.michael@gmail.com
do $$
declare
  target_user_id uuid;
begin
  select id into target_user_id from auth.users where email = '11p221.michael@gmail.com' limit 1;

  if target_user_id is not null then
    update public.expenses set user_id = target_user_id where user_id is null;
    update public.categories set user_id = target_user_id where user_id is null;
    update public.payment_history set user_id = target_user_id where user_id is null;
    update public.app_settings set user_id = target_user_id where user_id is null;
  end if;
end $$;

-- 3. Performance indexes on user_id
create index if not exists expenses_user_id_idx on public.expenses(user_id);
create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists payment_history_user_id_idx on public.payment_history(user_id);
create unique index if not exists app_settings_user_id_idx on public.app_settings(user_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'app_settings_user_id_key'
  ) then
    alter table public.app_settings add constraint app_settings_user_id_key unique (user_id);
  end if;
end $$;

-- 3. Enable Row Level Security (RLS)
alter table public.expenses enable row level security;
alter table public.categories enable row level security;
alter table public.payment_history enable row level security;
alter table public.app_settings enable row level security;

-- 4. Clean up any existing loose policies
drop policy if exists "Allow all access to payment_history" on public.payment_history;
drop policy if exists "expenses_user_isolation" on public.expenses;
drop policy if exists "categories_user_isolation" on public.categories;
drop policy if exists "app_settings_user_isolation" on public.app_settings;
drop policy if exists "payment_history_user_isolation" on public.payment_history;

-- 5. Create user isolation policies
create policy "expenses_user_isolation"
  on public.expenses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "categories_user_isolation"
  on public.categories
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "payment_history_user_isolation"
  on public.payment_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "app_settings_user_isolation"
  on public.app_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Trigger to automatically seed new users with app_settings & default categories
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Buat default app_settings untuk user baru
  insert into public.app_settings (user_id, default_notify_days_before, email_enabled, in_app_enabled, base_currency, user_email)
  values (new.id, 3, false, true, 'IDR', new.email)
  on conflict (user_id) do nothing;

  -- Buat default categories untuk user baru
  insert into public.categories (user_id, name)
  values
    (new.id, 'Streaming'),
    (new.id, 'AI Tools'),
    (new.id, 'Utilitas'),
    (new.id, 'Fitness')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on column public.expenses.user_id is 'Pemilik biaya berulang (auth.users)';
comment on column public.categories.user_id is 'Pemilik kategori (auth.users)';
comment on column public.payment_history.user_id is 'Pemilik riwayat pembayaran (auth.users)';
comment on column public.app_settings.user_id is 'Pemilik pengaturan (auth.users)';
