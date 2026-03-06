-- Create gallery_settings table for storing gallery configuration
CREATE TABLE IF NOT EXISTS gallery_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE gallery_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read settings
CREATE POLICY "Allow public read access to gallery settings"
  ON gallery_settings
  FOR SELECT
  TO public
  USING (true);

-- Create policy to allow authenticated users to update settings
CREATE POLICY "Allow authenticated users to update gallery settings"
  ON gallery_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default settings
INSERT INTO gallery_settings (key, value) VALUES
  ('gallery_title', '"Our Wedding Gallery"'::jsonb),
  ('allow_downloads', 'true'::jsonb),
  ('allow_favorites', 'true'::jsonb),
  ('allow_slideshow', 'true'::jsonb),
  ('allow_fullscreen', 'true'::jsonb),
  ('allow_zoom', 'true'::jsonb),
  ('allow_share', 'true'::jsonb),
  ('slideshow_interval', '3'::jsonb),
  ('default_view_mode', '"masonry"'::jsonb),
  ('items_per_page', '20'::jsonb),
  ('show_category_filter', 'true'::jsonb),
  ('show_photo_count', 'true'::jsonb),
  ('enable_keyboard_shortcuts', 'true'::jsonb),
  ('watermark_enabled', 'false'::jsonb),
  ('watermark_text', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_gallery_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_gallery_settings_timestamp
  BEFORE UPDATE ON gallery_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_settings_timestamp();
