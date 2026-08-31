ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS moving_from_floor_level text,
  ADD COLUMN IF NOT EXISTS moving_from_floor_number text,
  ADD COLUMN IF NOT EXISTS moving_to_floor_level text,
  ADD COLUMN IF NOT EXISTS moving_to_floor_number text;

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
  AND (moving_from_stairs_flights IS NULL OR moving_from_stairs_flights IN ('1','2','3','4','5','6+'))
  AND (moving_to_stairs_flights IS NULL OR moving_to_stairs_flights IN ('1','2','3','4','5','6+'))
  AND (NOT moving_from_stairs OR moving_from_stairs_flights IS NOT NULL)
  AND (NOT moving_to_stairs OR moving_to_stairs_flights IS NOT NULL)
  AND moving_from_floor_level IN ('ground','upper')
  AND (moving_from_floor_level = 'ground' OR moving_from_floor_number IN ('1','2','3','4','5','6+'))
  AND moving_to_floor_level IN ('ground','upper')
  AND (moving_to_floor_level = 'ground' OR moving_to_floor_number IN ('1','2','3','4','5','6+'))
  AND (
    (property_type IN ('house', 'apartment') AND bedrooms IN ('studio','1','2','3','4+') AND office_area_band IS NULL)
    OR (property_type = 'office' AND office_area_band IN ('under_500','500_1000','1000_2500','2500_plus') AND bedrooms IS NULL)
  )
  AND (
    (property_type IN ('house','apartment') AND furniture_items <@ ARRAY['sofa','armchair','bed','wardrobe','chest_of_drawers','dining_table','bookshelf','fridge_freezer','washing_machine','other_big_pieces']::text[])
    OR (property_type = 'office' AND furniture_items <@ ARRAY['desks','office_chairs','filing_cabinets','it_equipment','printers','big_tables','shelving_units','reception_seating','server_racks','other_big_items']::text[])
  )
  AND (
    COALESCE(array_length(furniture_items, 1), 0) >= 3
    OR (furniture_other_description IS NOT NULL AND length(furniture_other_description) BETWEEN 3 AND 500)
  )
);
