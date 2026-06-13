
CREATE TYPE public.property_type AS ENUM ('house', 'apartment', 'office');

CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_type public.property_type NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address TEXT NOT NULL,
  packaging_required BOOLEAN NOT NULL DEFAULT false,
  move_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.quote_requests TO anon, authenticated;
GRANT ALL ON public.quote_requests TO service_role;

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a quote request"
  ON public.quote_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(first_name) BETWEEN 1 AND 100
    AND length(last_name) BETWEEN 1 AND 100
    AND length(address) BETWEEN 3 AND 500
    AND (notes IS NULL OR length(notes) <= 2000)
  );
