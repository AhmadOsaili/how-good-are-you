CREATE POLICY "Partner members can update assigned leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'partner_member'::app_role)
  AND EXISTS (
    SELECT 1 FROM lead_assignments la
    JOIN company_users cu ON cu.company_id = la.company_id
    WHERE la.lead_id = leads.id AND cu.user_id = auth.uid()
  )
);