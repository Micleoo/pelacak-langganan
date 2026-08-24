-- Migration: Fix hardcoded URLs in cron jobs
-- Creates helper function to dynamically construct Edge Function URLs

-- Function to get the Supabase project URL from the current environment
-- This works because Supabase sets the SUPABASE_URL as a database setting
create or replace function public.get_edge_function_base_url()
returns text
language plpgsql
security definer
as $$
declare
  project_url text;
begin
  -- Try to get the project URL from Supabase settings
  -- SUPABASE_URL is typically available as a custom setting
  select current_setting('supabase.url', true) into project_url;
  
  if project_url is not null then
    return project_url || '/functions/v1';
  end if;
  
  -- Fallback: construct from the database host
  -- This works when running inside Supabase
  return 'https://' || split_part(current_setting('server_version'), ' ', 1) || '.supabase.co/functions/v1';
end;
$$;

-- Alternative: Use a configuration table approach for more flexibility
create table if not exists public.cron_config (
  key text primary key,
  value text not null,
  description text
);

-- Insert default configuration (will be overridden by environment-specific values)
insert into public.cron_config (key, value, description)
values 
  ('edge_function_base_url', '', 'Base URL for Edge Functions (auto-detected if empty)'),
  ('send_reminders_endpoint', '', 'Full URL for send-reminders function'),
  ('reconcile_expenses_endpoint', '', 'Full URL for reconcile-expenses function')
on conflict (key) do nothing;

-- Function to get the send-reminders endpoint
create or replace function public.get_send_reminders_url()
returns text
language plpgsql
security definer
as $$
declare
  configured_url text;
  auto_url text;
begin
  select value into configured_url from public.cron_config where key = 'send_reminders_endpoint';
  
  if configured_url is not null and configured_url != '' then
    return configured_url;
  end if;
  
  -- Auto-detect from database settings
  select current_setting('supabase.url', true) into auto_url;
  if auto_url is not null then
    return auto_url || '/functions/v1/send-reminders';
  end if;
  
  -- Last resort: use the known project ref (for backwards compatibility)
  return 'https://ohjiqunmvqqqvypwftjk.supabase.co/functions/v1/send-reminders';
end;
$$;

-- Function to get the reconcile-expenses endpoint
create or replace function public.get_reconcile_expenses_url()
returns text
language plpgsql
security definer
as $$
declare
  configured_url text;
  auto_url text;
begin
  select value into configured_url from public.cron_config where key = 'reconcile_expenses_endpoint';
  
  if configured_url is not null and configured_url != '' then
    return configured_url;
  end if;
  
  select current_setting('supabase.url', true) into auto_url;
  if auto_url is not null then
    return auto_url || '/functions/v1/reconcile-expenses';
  end if;
  
  return 'https://ohjiqunmvqqqvypwftjk.supabase.co/functions/v1/reconcile-expenses';
end;
$$;

-- Grant access
grant execute on function public.get_edge_function_base_url() to anon, authenticated, service_role;
grant execute on function public.get_send_reminders_url() to anon, authenticated, service_role;
grant execute on function public.get_reconcile_expenses_url() to anon, authenticated, service_role;
grant select on public.cron_config to anon, authenticated, service_role;