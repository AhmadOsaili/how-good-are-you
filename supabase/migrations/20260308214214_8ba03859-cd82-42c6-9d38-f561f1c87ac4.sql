ALTER TABLE public.company_users ADD CONSTRAINT company_users_email_unique UNIQUE (email);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_email_unique UNIQUE (email);
ALTER TABLE public.companies ADD CONSTRAINT companies_email_unique UNIQUE (email);
ALTER TABLE public.leads ADD CONSTRAINT leads_email_unique UNIQUE (email);