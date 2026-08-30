ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS calculated_hours numeric,
  ADD COLUMN IF NOT EXISTS calculated_total numeric,
  ADD COLUMN IF NOT EXISTS needs_manual_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pricing_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS pricing_calculated_at timestamptz;
