-- Seed kategori bawaan Pelacak Langganan (ADR-0002: identitas kategori).
-- Idempoten: hanya insert jika belum ada. Jalankan via Supabase SQL Editor / CLI.
-- Kategori tambahan boleh dibuat dari UI (/categories).

insert into public.categories (name)
select name
from (values
  ('Streaming'),
  ('AI Tools'),
  ('Utilitas'),
  ('Fitness')
) as seed(name)
where not exists (select 1 from public.categories c where c.name = seed.name);
