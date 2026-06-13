ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS end_of_tenancy_cleaning boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS handyman_services boolean NOT NULL DEFAULT false;