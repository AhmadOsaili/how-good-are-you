
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_email_unique;
ALTER TABLE public.leads ADD CONSTRAINT leads_email_address_unique UNIQUE (email, address);
