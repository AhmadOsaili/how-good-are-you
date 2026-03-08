
-- Add email column to user_roles
ALTER TABLE public.user_roles ADD COLUMN email text;

-- Add email column to company_users
ALTER TABLE public.company_users ADD COLUMN email text;

-- Backfill emails from auth.users
UPDATE public.user_roles SET email = (SELECT email FROM auth.users WHERE id = user_roles.user_id);
UPDATE public.company_users SET email = (SELECT email FROM auth.users WHERE id = company_users.user_id);
