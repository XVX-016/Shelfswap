/*
  # Update Chat System for Book Messages

  1. Changes
    - Add book_id to messages table
    - Add indexes for better query performance
    - Update policies for buyer-seller messaging

  2. Security
    - Enable RLS
    - Add policies for book-related messages
*/

-- Add book_id to messages
ALTER TABLE messages
ADD COLUMN book_id uuid REFERENCES books(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_book_id ON messages(book_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- Update message policies
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON messages;

CREATE POLICY "Users can view messages for their books"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = messages.book_id
      AND books.seller_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages about books"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_id
      AND books.status = 'available'
    )
  );