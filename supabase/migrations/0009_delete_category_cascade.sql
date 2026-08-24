-- Migration: Atomic delete category with cascade to expenses
-- Provides a transactional RPC function to delete category and update expenses atomically

create or replace function public.delete_category_with_cascade(p_category_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Atomic operation: delete category and set category_id to NULL for related expenses
  -- Using a CTE to ensure both operations happen in a single transaction
  with deleted as (
    delete from public.categories
    where id = p_category_id
    returning id
  )
  update public.expenses
  set category_id = null,
      updated_at = now()
  where category_id = p_category_id;
end;
$$;

grant execute on function public.delete_category_with_cascade(uuid) to anon, authenticated, service_role;