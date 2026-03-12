-- Add weekly_goal column to user_progress
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS weekly_goal integer DEFAULT 20;

-- Update RLS (if needed, but existing policy should allow user to update their own row)
-- No new policy needed if 'manage their progress' policy exists. 