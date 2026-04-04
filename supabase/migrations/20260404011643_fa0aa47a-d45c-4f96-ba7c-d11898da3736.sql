ALTER TABLE public.leads ADD COLUMN lead_score integer DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN score_reasoning text DEFAULT NULL;