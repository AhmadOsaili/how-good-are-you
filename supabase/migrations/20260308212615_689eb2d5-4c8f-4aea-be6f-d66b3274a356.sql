CREATE POLICY "Users can view own company membership"
ON public.company_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());