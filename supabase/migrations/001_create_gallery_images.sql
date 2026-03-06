-- Create gallery_images table for storing wedding gallery photos
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  src TEXT NOT NULL,
  full_src TEXT NOT NULL,
  alt TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Ceremony', 'Reception', 'Portraits', 'Details')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_gallery_images_category ON gallery_images(category);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at ON gallery_images(created_at DESC);

-- Enable Row Level Security
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view images
CREATE POLICY "Allow authenticated users to view gallery images"
  ON gallery_images
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert images (for admin use)
CREATE POLICY "Allow authenticated users to insert gallery images"
  ON gallery_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to update images (for admin use)
CREATE POLICY "Allow authenticated users to update gallery images"
  ON gallery_images
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy to allow authenticated users to delete images (for admin use)
CREATE POLICY "Allow authenticated users to delete gallery images"
  ON gallery_images
  FOR DELETE
  TO authenticated
  USING (true);
