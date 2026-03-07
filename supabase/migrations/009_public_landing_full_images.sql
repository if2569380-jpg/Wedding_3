-- Keep most full-resolution images private.
-- Allow public read access only for the specific full images used on landing page.

DROP POLICY IF EXISTS "Public read landing full images" ON storage.objects;

CREATE POLICY "Public read landing full images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'gallery'
    AND name IN (
      'full/e2f0393f-98af-4204-bbfb-c35466695a02-1772830664406.jfif',
      'full/cfc8fac2-ad0a-4e8d-a9d1-7d934c682fb1-1772828895513.jfif',
      'full/82ebe6d4-d97a-44c1-b1cd-b6713c33b9d0-1772830623681.jfif',
      'full/1da8e16b-3082-4c77-967d-82a0ee36e8b2-1772828877550.jfif',
      'full/59181363-2d7c-427f-959c-509a4dd4d0d1-1772828921774.jfif'
    )
  );
