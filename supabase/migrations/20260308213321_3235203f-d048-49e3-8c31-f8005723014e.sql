CREATE POLICY "Partner members can view assigned leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'partner_member'::app_role)
  AND EXISTS (
    SELECT 1 FROM lead_assignments la
    JOIN company_users cu ON cu.company_id = la.company_id
    WHERE la.lead_id = leads.id AND cu.user_id = auth.uid()
  )
);

CREATE POLICY "Partner members can view own assignments"
ON public.lead_assignments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'partner_member'::app_role)
  AND EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.company_id = lead_assignments.company_id AND cu.user_id = auth.uid()
  )
);