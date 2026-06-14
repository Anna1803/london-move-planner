
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS moving_from_street text,
  ADD COLUMN IF NOT EXISTS moving_from_number text,
  ADD COLUMN IF NOT EXISTS moving_from_postcode text,
  ADD COLUMN IF NOT EXISTS moving_to_street text,
  ADD COLUMN IF NOT EXISTS moving_to_number text,
  ADD COLUMN IF NOT EXISTS moving_to_postcode text;

DROP POLICY IF EXISTS "Anyone can submit a quote request" ON public.quote_requests;

CREATE POLICY "Anyone can submit a quote request"
ON public.quote_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(first_name) BETWEEN 1 AND 100
  AND length(last_name) BETWEEN 1 AND 100
  AND length(email) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND phone ~ '^[+0-9 ()-]{5,30}$'
  AND length(moving_from_address) BETWEEN 3 AND 500
  AND length(moving_to_address) BETWEEN 3 AND 500
  AND (moving_from_street IS NULL OR length(moving_from_street) <= 200)
  AND (moving_from_number IS NULL OR length(moving_from_number) <= 20)
  AND (moving_from_postcode IS NULL OR length(moving_from_postcode) <= 20)
  AND (moving_to_street IS NULL OR length(moving_to_street) <= 200)
  AND (moving_to_number IS NULL OR length(moving_to_number) <= 20)
  AND (moving_to_postcode IS NULL OR length(moving_to_postcode) <= 20)
  AND length(preferred_time) BETWEEN 1 AND 50
  AND (notes IS NULL OR length(notes) <= 2000)
);
