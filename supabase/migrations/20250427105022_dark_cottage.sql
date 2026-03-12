/*
  # Add User Features

  1. New Tables
    - `study_groups`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `creator_id` (uuid, references users)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

    - `study_group_members`
      - `group_id` (uuid, references study_groups)
      - `user_id` (uuid, references users)
      - `role` (text) - creator, member
      - `joined_at` (timestamp with time zone)

    - `study_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `duration` (integer) - in minutes
      - `subject` (text)
      - `started_at` (timestamp with time zone)
      - `ended_at` (timestamp with time zone)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for study groups and sessions
*/

-- Create Study Groups Table
CREATE TABLE IF NOT EXISTS study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Study Group Members Table
CREATE TABLE IF NOT EXISTS study_group_members (
  group_id uuid REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('creator', 'member')),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Create Study Sessions Table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  duration integer NOT NULL,
  subject text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Study Groups Policies
CREATE POLICY "Users can view all study groups"
  ON study_groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create study groups"
  ON study_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their study groups"
  ON study_groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Study Group Members Policies
CREATE POLICY "Users can view group members"
  ON study_group_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join groups"
  ON study_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Study Sessions Policies
CREATE POLICY "Users can manage their study sessions"
  ON study_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updating updated_at
CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON study_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();