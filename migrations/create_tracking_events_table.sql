-- Create tracking_events table
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tracking_events_event ON tracking_events(event);
CREATE INDEX IF NOT EXISTS idx_tracking_events_user_id ON tracking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_session_id ON tracking_events(session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON tracking_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON tracking_events(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow inserts from anyone (anonymous tracking)
CREATE POLICY "Allow insert tracking events" ON tracking_events
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow select only for authenticated users (admin view)
CREATE POLICY "Allow select tracking events for authenticated users" ON tracking_events
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create a view for analytics
CREATE OR REPLACE VIEW tracking_analytics AS
SELECT 
  event,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  DATE(timestamp) as event_date
FROM tracking_events
GROUP BY event, DATE(timestamp)
ORDER BY event_date DESC, event_count DESC;

-- Create a view for user activity
CREATE OR REPLACE VIEW user_activity AS
SELECT 
  user_id,
  session_id,
  COUNT(*) as event_count,
  MIN(timestamp) as first_event,
  MAX(timestamp) as last_event,
  ARRAY_AGG(DISTINCT event) as events
FROM tracking_events
WHERE user_id IS NOT NULL
GROUP BY user_id, session_id
ORDER BY last_event DESC;

-- Create a view for session activity
CREATE OR REPLACE VIEW session_activity AS
SELECT 
  session_id,
  user_id,
  COUNT(*) as event_count,
  MIN(timestamp) as session_start,
  MAX(timestamp) as session_end,
  EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as session_duration_seconds,
  ARRAY_AGG(DISTINCT event) as events
FROM tracking_events
GROUP BY session_id, user_id
ORDER BY session_end DESC;
