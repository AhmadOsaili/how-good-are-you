-- Add new lead statuses
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'closed_won';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'closed_lost';

-- Add 'partner' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';
