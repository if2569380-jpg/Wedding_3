-- Migration to add source_type column for YouTube support
ALTER TABLE songs ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'local' CHECK (source_type IN ('local', 'youtube'));

-- Update existing songs to have source_type = 'local'
UPDATE songs SET source_type = 'local' WHERE source_type IS NULL;
