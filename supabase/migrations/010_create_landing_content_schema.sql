-- Create dedicated public bucket for landing/collage assets.
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-public', 'landing-public', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

DROP POLICY IF EXISTS "Public read landing-public objects" ON storage.objects;
CREATE POLICY "Public read landing-public objects"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'landing-public');

-- Story cards shown on public landing page.
CREATE TABLE IF NOT EXISTS landing_story_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  image_path TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  section_type TEXT NOT NULL DEFAULT 'story' CHECK (section_type IN ('story', 'countdown')),
  countdown_target TIMESTAMP WITH TIME ZONE,
  icon_token TEXT NOT NULL CHECK (icon_token IN ('heart', 'sparkles', 'calendar', 'music', 'timer', 'camera', 'map_pin')),
  background_token TEXT NOT NULL CHECK (background_token IN ('ivory', 'sand', 'taupe', 'olive', 'charcoal')),
  text_token TEXT NOT NULL CHECK (text_token IN ('stone_dark', 'stone_light')),
  accent_token TEXT NOT NULL CHECK (accent_token IN ('rose', 'amber', 'stone', 'blue', 'emerald')),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landing_story_cards_order
  ON landing_story_cards(order_index ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_landing_story_cards_active
  ON landing_story_cards(is_active);

-- Polaroid collage items shown on public landing page.
CREATE TABLE IF NOT EXISTS landing_collage_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caption TEXT NOT NULL,
  image_path TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landing_collage_items_order
  ON landing_collage_items(order_index ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_landing_collage_items_active
  ON landing_collage_items(is_active);

ALTER TABLE landing_story_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_collage_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION set_landing_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_landing_story_cards_updated_at ON landing_story_cards;
CREATE TRIGGER trigger_landing_story_cards_updated_at
  BEFORE UPDATE ON landing_story_cards
  FOR EACH ROW
  EXECUTE FUNCTION set_landing_content_updated_at();

DROP TRIGGER IF EXISTS trigger_landing_collage_items_updated_at ON landing_collage_items;
CREATE TRIGGER trigger_landing_collage_items_updated_at
  BEFORE UPDATE ON landing_collage_items
  FOR EACH ROW
  EXECUTE FUNCTION set_landing_content_updated_at();
