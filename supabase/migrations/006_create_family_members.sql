-- Create family_members table for storing family member profiles and welcome messages
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  welcome_message TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookup
CREATE INDEX IF NOT EXISTS idx_family_members_email ON family_members(email);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_family_members_active ON family_members(is_active);

-- Enable Row Level Security
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view family members
CREATE POLICY "Allow authenticated users to view family members"
  ON family_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert family members
CREATE POLICY "Allow authenticated users to insert family members"
  ON family_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to update family members
CREATE POLICY "Allow authenticated users to update family members"
  ON family_members
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy to allow authenticated users to delete family members
CREATE POLICY "Allow authenticated users to delete family members"
  ON family_members
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_family_members_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_family_members_timestamp
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_family_members_timestamp();

-- Insert sample family members (optional - remove or modify as needed)
INSERT INTO family_members (email, name, relationship, welcome_message, is_active) VALUES
  ('uncle@example.com', 'Uncle Ahmed', 'Bride''s Uncle', 'Welcome Uncle! We''re so glad you could join us to celebrate this special moment.', true),
  ('aunt@example.com', 'Aunt Fatima', 'Groom''s Aunt', 'Dear Auntie, your presence makes our day even more special. Welcome!', true)
ON CONFLICT (email) DO NOTHING;
