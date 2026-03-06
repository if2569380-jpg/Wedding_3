-- Create songs table for storing background music
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  src TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on display_order for sorting
CREATE INDEX IF NOT EXISTS idx_songs_display_order ON songs(display_order);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_songs_is_active ON songs(is_active);

-- Enable Row Level Security
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view active songs (for public gallery)
CREATE POLICY "Allow public to view active songs"
  ON songs
  FOR SELECT
  TO public
  USING (is_active = true);

-- Create policy to allow authenticated users to view all songs (for admin)
CREATE POLICY "Allow authenticated users to view all songs"
  ON songs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert songs (for admin use)
CREATE POLICY "Allow authenticated users to insert songs"
  ON songs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to update songs (for admin use)
CREATE POLICY "Allow authenticated users to update songs"
  ON songs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy to allow authenticated users to delete songs (for admin use)
CREATE POLICY "Allow authenticated users to delete songs"
  ON songs
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_songs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_songs_timestamp
  BEFORE UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_songs_timestamp();

-- Insert default songs from public/music folder (if exists)
INSERT INTO songs (title, artist, src, is_active, display_order) VALUES
  ('Romantic Day', 'Wedding Music', '/music/Romantic-Day-chosic.com_.mp3', true, 1),
  ('Hope Emotional Soundtrack', 'Wedding Music', '/music/Hope-Emotional-Soundtrack(chosic.com).mp3', true, 2),
  ('Music', 'Wedding Music', '/music/music.mp3', true, 3)
ON CONFLICT DO NOTHING;
