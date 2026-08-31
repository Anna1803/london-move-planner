-- Private bucket for property photos attached to a quote request.
-- Size/type limits are enforced server-side here too, not just client-side.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quote-photos',
  'quote-photos',
  false,
  10485760, -- 10MB, matching the client-side MAX_PHOTO_SIZE_MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- anon/authenticated can upload into this bucket only — no read, update, or delete.
-- Matches the same insert-only pattern used everywhere else in this app.
CREATE POLICY "Anyone can upload quote photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'quote-photos');

CREATE POLICY "Deny public read access to quote photos storage"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'quote-photos' AND false);

CREATE POLICY "Deny public update to quote photos storage"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'quote-photos' AND false)
WITH CHECK (false);

CREATE POLICY "Deny public delete to quote photos storage"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'quote-photos' AND false);

-- One row per uploaded photo, referencing the quote it belongs to.
CREATE TABLE public.quote_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.quote_photos TO anon, authenticated;
GRANT ALL ON public.quote_photos TO service_role;

ALTER TABLE public.quote_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can attach a photo to a quote request"
ON public.quote_photos
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(storage_path) BETWEEN 1 AND 500
  AND (file_name IS NULL OR length(file_name) <= 255)
  AND (file_size IS NULL OR file_size <= 10485760)
);

REVOKE SELECT, UPDATE, DELETE ON public.quote_photos FROM anon, authenticated;

CREATE POLICY "Deny public read access to quote photos"
ON public.quote_photos FOR SELECT TO anon, authenticated USING (false);

CREATE POLICY "Deny public update access to quote photos"
ON public.quote_photos FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Deny public delete access to quote photos"
ON public.quote_photos FOR DELETE TO anon, authenticated USING (false);
