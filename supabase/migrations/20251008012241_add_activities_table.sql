/*
  # Add Activities Table for System Activity Tracking
  
  Creates a table to track all system activities for the Recent Activity feed
*/

-- Activities table for tracking system events
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  user_name text NOT NULL,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  entity_name text,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policy - everyone can read activities
DROP POLICY IF EXISTS "Users can read activities" ON activities;
CREATE POLICY "Users can read activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy - authenticated users can create activities
DROP POLICY IF EXISTS "Users can create activities" ON activities;
CREATE POLICY "Users can create activities"
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity_type ON activities(entity_type);
