-- Table linking users to companies with company-level roles
CREATE TABLE public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_role text NOT NULL DEFAULT 'member' CHECK (company_role IN ('company_admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Helper function: get company_id for a user
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.company_users WHERE user_id = _user_id LIMIT 1
$$;

-- Helper function: check if user is company_admin for a company
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = _user_id AND company_id = _company_id AND company_role = 'company_admin'
  )
$$;

-- Admins can do everything on company_users
CREATE POLICY "Admins can manage company_users"
  ON public.company_users FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Company admins can view their company's users
CREATE POLICY "Company admins can view company users"
  ON public.company_users FOR SELECT
  TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id));

-- Company admins can add members to their company
CREATE POLICY "Company admins can add company users"
  ON public.company_users FOR INSERT
  TO authenticated
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- Company admins can remove members from their company
CREATE POLICY "Company admins can delete company users"
  ON public.company_users FOR DELETE
  TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id));

-- Partners can view their own assigned leads
CREATE POLICY "Partners can view assigned leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'partner') AND
    EXISTS (
      SELECT 1 FROM public.lead_assignments la
      JOIN public.company_users cu ON cu.company_id = la.company_id
      WHERE la.lead_id = leads.id AND cu.user_id = auth.uid()
    )
  );

-- Partners can update status on their assigned leads
CREATE POLICY "Partners can update assigned leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'partner') AND
    EXISTS (
      SELECT 1 FROM public.lead_assignments la
      JOIN public.company_users cu ON cu.company_id = la.company_id
      WHERE la.lead_id = leads.id AND cu.user_id = auth.uid()
    )
  );

-- Partners can view their own assignments
CREATE POLICY "Partners can view own assignments"
  ON public.lead_assignments FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'partner') AND
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = lead_assignments.company_id AND cu.user_id = auth.uid()
    )
  );
