/*
  # Fix username column in users table

  1. Changes
    - Ensure username column exists in users table
    - Add proper constraints and validation
    - Update existing users with default usernames if needed
    - Handle all edge cases for existing data

  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity
*/

-- First, check if the users table exists, if not create it
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Add full_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE users ADD COLUMN full_name text;
  END IF;
END $$;

-- Add avatar_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Update existing users without username to have a default username based on email
UPDATE users 
SET username = LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-z0-9]', '_', 'g'))
WHERE username IS NULL OR username = '';

-- Ensure all usernames are unique by appending numbers if needed
DO $$
DECLARE
  user_record RECORD;
  new_username text;
  counter integer;
BEGIN
  FOR user_record IN 
    SELECT id, username, email 
    FROM users 
    WHERE username IS NOT NULL
  LOOP
    new_username := user_record.username;
    counter := 1;
    
    -- Check if username already exists for another user
    WHILE EXISTS (
      SELECT 1 FROM users 
      WHERE username = new_username 
      AND id != user_record.id
    ) LOOP
      new_username := user_record.username || '_' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update if we had to change the username
    IF new_username != user_record.username THEN
      UPDATE users SET username = new_username WHERE id = user_record.id;
    END IF;
  END LOOP;
END $$;

-- Add constraints safely
DO $$
BEGIN
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'users' AND constraint_name = 'users_username_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
  END IF;
  
  -- Add format constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'users' AND constraint_name = 'username_format'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]+$');
  END IF;
END $$;

-- Set username as NOT NULL
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- Enable Row Level Security if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can read own data'
  ) THEN
    CREATE POLICY "Users can read own data"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can update own data'
  ) THEN
    CREATE POLICY "Users can update own data"
      ON users
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can insert own data'
  ) THEN
    CREATE POLICY "Users can insert own data"
      ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;