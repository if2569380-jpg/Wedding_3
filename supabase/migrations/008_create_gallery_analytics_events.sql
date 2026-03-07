-- Track gallery engagement and guest login analytics.
CREATE TABLE IF NOT EXISTS gallery_analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'download', 'share', 'login')),
  photo_id UUID REFERENCES gallery_images(id) ON DELETE CASCADE,
  user_id UUID,
  user_email TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT gallery_analytics_photo_required CHECK (
    (event_type = 'login' AND photo_id IS NULL)
    OR (event_type IN ('view', 'download', 'share') AND photo_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_gallery_analytics_events_type_created_at
  ON gallery_analytics_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_analytics_events_photo_type
  ON gallery_analytics_events(photo_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_analytics_events_user_type
  ON gallery_analytics_events(user_id, event_type, created_at DESC);

ALTER TABLE gallery_analytics_events ENABLE ROW LEVEL SECURITY;
