-- Allow custom categories for gallery images.
-- Previously category was restricted to a fixed set.

ALTER TABLE gallery_images
DROP CONSTRAINT IF EXISTS gallery_images_category_check;

ALTER TABLE gallery_images
ADD CONSTRAINT gallery_images_category_check
CHECK (
  length(btrim(category)) > 0
  AND length(category) <= 100
);
