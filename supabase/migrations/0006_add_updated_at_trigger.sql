-- Add updated_at auto-update trigger for expenses and categories tables

-- Function to update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for expenses table
drop trigger if exists trigger_set_updated_at_expenses on public.expenses;
create trigger trigger_set_updated_at_expenses
before update on public.expenses
for each row
execute function public.set_updated_at();

-- Trigger for categories table
drop trigger if exists trigger_set_updated_at_categories on public.categories;
create trigger trigger_set_updated_at_categories
before update on public.categories
for each row
execute function public.set_updated_at();

-- Also add updated_at column to categories if not exists
alter table public.categories
add column if not exists updated_at timestamptz not null default now();
