/*
  # Add missing username column to users table

  1. Changes
    - Add username column to users table if it doesn't exist
    - Add unique constraint and format validation
    - Update existing users with a default username based on email

  2. Security
    - Maintains existing RLS policies
*/

-- Add username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE users ADD COLUMN username text;
  END IF;
END $$;

-- Update existing users without username to have a default username
UPDATE users 
SET username = LOWER(REPLACE(SPLIT_PART(email, '@', 1), '.', '_'))
WHERE username IS NULL OR username = '';

-- Add constraints
ALTER TABLE users
ADD CONSTRAINT IF NOT EXISTS users_username_unique UNIQUE (username);

ALTER TABLE users
ADD CONSTRAINT IF NOT EXISTS username_format CHECK (username ~ '^[a-z0-9_]+$');

ALTER TABLE users
ALTER COLUMN username SET NOT NULL;