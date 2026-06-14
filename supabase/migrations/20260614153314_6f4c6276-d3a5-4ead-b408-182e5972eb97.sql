
-- Drop dependent policy first
DROP POLICY IF EXISTS "Anyone can submit a quote request" ON public.quote_requests;

-- Add new columns
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS moving_from_address text,
  ADD COLUMN IF NOT EXISTS moving_to_address text,
  ADD COLUMN IF NOT EXISTS preferred_time text;

UPDATE public.quote_requests
  SET moving_from_address = address
  WHERE moving_from_address IS NULL AND address IS NOT NULL;

UPDATE public.quote_requests
  SET email = COALESCE(email, 'unknown@example.com'),
      phone = COALESCE(phone, 'unknown'),
      moving_to_address = COALESCE(moving_to_address, 'unknown'),
      preferred_time = COALESCE(preferred_time, 'unknown');

ALTER TABLE public.quote_requests
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN moving_from_address SET NOT NULL,
  ALTER COLUMN moving_to_address SET NOT NULL,
  ALTER COLUMN preferred_time SET NOT NULL;

ALTER TABLE public.quote_requests DROP COLUMN IF EXISTS address;

CREATE POLICY "Anyone can submit a quote request"
ON public.quote_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(first_name) BETWEEN 1 AND 100
  AND length(last_name) BETWEEN 1 AND 100
  AND length(email) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(phone) BETWEEN 5 AND 30
  AND length(moving_from_address) BETWEEN 3 AND 500
  AND length(moving_to_address) BETWEEN 3 AND 500
  AND length(preferred_time) BETWEEN 1 AND 50
  AND (notes IS NULL OR length(notes) <= 2000)
);
