/*
  # Fix Missing Tables and RLS Policies

  1. Create Missing Tables
    - `support_messages` - for customer support
    - `study_sessions` - for study tracking
    - `study_groups` - for group study
    - `study_group_members` - for group membership

  2. Fix RLS Policies
    - Update all policies to use (select auth.uid()) for better performance
    - Only create policies for existing tables

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Create Support Messages Table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Study Sessions Table if it doesn't exist
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  duration integer NOT NULL,
  subject text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Create Study Groups Table if it doesn't exist
CREATE TABLE IF NOT EXISTS study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Study Group Members Table if it doesn't exist
CREATE TABLE IF NOT EXISTS study_group_members (
  group_id uuid REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('creator', 'member')),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Create User Progress Table for tracking study progress
CREATE TABLE IF NOT EXISTS user_progress (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  study_time integer DEFAULT 0,
  streak integer DEFAULT 0,
  study_groups integer DEFAULT 0,
  active_goals integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Anyone can read available books" ON books;
DROP POLICY IF EXISTS "Users can create books" ON books;
DROP POLICY IF EXISTS "Users can update own books" ON books;
DROP POLICY IF EXISTS "Users can view messages for their books" ON messages;
DROP POLICY IF EXISTS "Users can send messages about books" ON messages;

-- Create optimized policies for core tables
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- Books policies
CREATE POLICY "Anyone can read books"
  ON books
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create books"
  ON books
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = seller_id);

CREATE POLICY "Users can update own books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (seller_id = (select auth.uid()));

-- Messages policies
CREATE POLICY "Users can view messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = messages.book_id
      AND books.seller_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));

-- Support Messages policies
CREATE POLICY "Users can view their support messages"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create support messages"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Study Sessions policies
CREATE POLICY "Users can manage their study sessions"
  ON study_sessions
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Study Groups policies
CREATE POLICY "Users can view all study groups"
  ON study_groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create study groups"
  ON study_groups
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = creator_id);

CREATE POLICY "Creators can update their study groups"
  ON study_groups
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = creator_id);

-- Study Group Members policies
CREATE POLICY "Users can view group members"
  ON study_group_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join groups"
  ON study_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- User Progress policies
CREATE POLICY "Users can manage their progress"
  ON user_progress
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_support_messages_updated_at ON support_messages;
CREATE TRIGGER update_support_messages_updated_at
  BEFORE UPDATE ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_study_groups_updated_at ON study_groups;
CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON study_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();