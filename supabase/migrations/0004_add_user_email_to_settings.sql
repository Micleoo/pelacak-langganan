-- Add user_email column to app_settings for email notifications
-- This column stores the user's email address for Resend email reminders

alter table public.app_settings
add column if not exists user_email text;

-- Add comment for documentation
comment on column public.app_settings.user_email is 'Email address for sending notification reminders via Resend';