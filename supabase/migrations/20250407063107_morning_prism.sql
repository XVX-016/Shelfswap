/*
  # Add Chat and Friends functionality

  1. New Tables
    - `chats`
      - `id` (uuid, primary key)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

    - `chat_participants`
      - `chat_id` (uuid, references chats)
      - `user_id` (uuid, references users)
      - `created_at` (timestamp with time zone)

    - `messages`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, references chats)
      - `sender_id` (uuid, references users)
      - `content` (text)
      - `created_at` (timestamp with time zone)

    - `friends`
      - `user_id` (uuid, references users)
      - `friend_id` (uuid, references users)
      - `status` (text) - pending, accepted
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for chat and friend management
*/

-- Create Chats Table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Chat Participants Table
CREATE TABLE IF NOT EXISTS chat_participants (
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);

-- Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create Friends Table
CREATE TABLE IF NOT EXISTS friends (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  friend_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, friend_id)
);

-- Enable Row Level Security
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Chat Policies
CREATE POLICY "Users can view their chats"
  ON chats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = chats.id
      AND user_id = auth.uid()
    )
  );

-- Chat Participants Policies
CREATE POLICY "Users can view chat participants"
  ON chat_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.chat_id = chat_participants.chat_id
      AND cp.user_id = auth.uid()
    )
  );

-- Messages Policies
CREATE POLICY "Users can view messages in their chats"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = messages.chat_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their chats"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = messages.chat_id
      AND user_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

-- Friends Policies
CREATE POLICY "Users can view their friends"
  ON friends
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR friend_id = auth.uid()
  );

CREATE POLICY "Users can send friend requests"
  ON friends
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
  );

CREATE POLICY "Users can accept friend requests"
  ON friends
  FOR UPDATE
  TO authenticated
  USING (
    friend_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    status = 'accepted'
  );

-- Add trigger for updating updated_at
CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friends_updated_at
  BEFORE UPDATE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();