-- Drop all policies first
DROP POLICY IF EXISTS "Admins can manage company_users" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can view company users" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can add company users" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can delete company users" ON public.company_users;
DROP POLICY IF EXISTS "Users can view own company membership" ON public.company_users;
DROP FUNCTION IF EXISTS public.is_company_admin(uuid, uuid);

-- Create enum if not exists
DO $$ BEGIN CREATE TYPE public.company_role AS ENUM ('company_admin', 'member'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add new enum column
ALTER TABLE public.company_users ADD COLUMN company_role_new public.company_role DEFAULT 'member'::public.company_role;

-- Copy data
UPDATE public.company_users SET company_role_new = company_role::public.company_role;

-- Drop old column and rename
ALTER TABLE public.company_users DROP COLUMN company_role;
ALTER TABLE public.company_users RENAME COLUMN company_role_new TO company_role;
ALTER TABLE public.company_users ALTER COLUMN company_role SET NOT NULL;
ALTER TABLE public.company_users ALTER COLUMN company_role SET DEFAULT 'member'::public.company_role;

-- Recreate function
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid, _company_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = _user_id AND company_id = _company_id AND company_role = 'company_admin'::public.company_role
  )
$$;

-- Recreate policies
CREATE POLICY "Admins can manage company_users"
  ON public.company_users FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company admins can view company users"
  ON public.company_users FOR SELECT
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company admins can add company users"
  ON public.company_users FOR INSERT
  WITH CHECK (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company admins can delete company users"
  ON public.company_users FOR DELETE
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can view own company membership"
  ON public.company_users FOR SELECT
  USING (user_id = auth.uid());