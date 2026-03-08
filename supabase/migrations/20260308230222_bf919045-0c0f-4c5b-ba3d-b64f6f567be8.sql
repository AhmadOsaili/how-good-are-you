
ALTER TABLE public.leads ADD COLUMN state text NOT NULL DEFAULT '';
ALTER TABLE public.leads ADD COLUMN city text NOT NULL DEFAULT '';
UPDATE public.leads SET state = 'TX' WHERE state = '';
