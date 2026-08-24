-- Reconciliation function untuk membersihkan expenses yang category_id-nya tidak valid
-- Jalankan via Supabase SQL Editor / CLI

create or replace function public.reconcile_orphaned_expenses()
returns integer language plpgsql as $$
declare
  updated_count integer;
begin
  update public.expenses
  set category_id = null
  where category_id is not null
  and not exists (
    select 1 from public.categories where id = expenses.category_id
  );

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- Grant execute ke anon/service_role
grant execute on function public.reconcile_orphaned_expenses() to anon, authenticated, service_role;