/*
  # Add Customer Support Messages Table

  1. New Tables
    - `support_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `message` (text, not null)
      - `status` (text) - pending, in_progress, resolved
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS
    - Add policies for user messages
*/

-- Create Support Messages Table
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their support messages"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create support messages"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add trigger for updating updated_at
CREATE TRIGGER update_support_messages_updated_at
  BEFORE UPDATE ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();