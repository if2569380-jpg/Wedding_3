-- Allow public read access to thumbnail assets only.
-- Full images remain private and should be delivered via signed URLs.

DROP POLICY IF EXISTS "Public read gallery objects" ON storage.objects;
DROP POLICY IF EXISTS "Public read gallery thumbnails" ON storage.objects;

CREATE POLICY "Public read gallery thumbnails"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'gallery'
    AND name LIKE 'thumbnails/%'
  );
