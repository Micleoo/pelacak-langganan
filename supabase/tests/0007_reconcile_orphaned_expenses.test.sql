-- Test untuk fungsi reconcile_orphaned_expenses
-- Jalankan di Supabase SQL Editor

-- Setup: Insert kategori valid
INSERT INTO public.categories (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Valid Category')
ON CONFLICT DO NOTHING;

-- Insert expense dengan category_id valid
INSERT INTO public.expenses (id, name, amount, interval, category_id, status, next_billing_date)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Valid Expense', 100000, 'monthly', '11111111-1111-1111-1111-111111111111', 'active', '2026-09-01')
ON CONFLICT DO NOTHING;

-- Insert expense dengan category_id INVALID (orphaned)
INSERT INTO public.expenses (id, name, amount, interval, category_id, status, next_billing_date)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Orphaned Expense', 50000, 'monthly', '99999999-9999-9999-9999-999999999999', 'active', '2026-09-01')
ON CONFLICT DO NOTHING;

-- Insert expense dengan category_id NULL (sudah benar)
INSERT INTO public.expenses (id, name, amount, interval, category_id, status, next_billing_date)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'No Category Expense', 75000, 'monthly', NULL, 'active', '2026-09-01')
ON CONFLICT DO NOTHING;

-- Verifikasi sebelum reconcile
SELECT 'Before reconcile:' as step;
SELECT id, name, category_id FROM public.expenses WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);

-- Jalankan reconcile
SELECT public.reconcile_orphaned_expenses();

-- Verifikasi setelah reconcile
SELECT 'After reconcile:' as step;
SELECT id, name, category_id FROM public.expenses WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);

-- Expected results:
-- - Valid Expense: category_id tetap '11111111-1111-1111-1111-111111111111'
-- - Orphaned Expense: category_id jadi NULL
-- - No Category Expense: category_id tetap NULL