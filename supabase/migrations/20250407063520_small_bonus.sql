/*
  # Add Wishlist and Book Swap Features

  1. New Tables
    - `wishlists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `book_id` (uuid, references books)
      - `created_at` (timestamp with time zone)

    - `book_swaps`
      - `id` (uuid, primary key)
      - `requester_book_id` (uuid, references books)
      - `owner_book_id` (uuid, references books)
      - `status` (text) - pending, accepted, rejected, completed
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for wishlist and swap management
*/

-- Create Wishlists Table
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Create Book Swaps Table
CREATE TABLE IF NOT EXISTS book_swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  owner_book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_swaps ENABLE ROW LEVEL SECURITY;

-- Wishlist Policies
CREATE POLICY "Users can manage their wishlists"
  ON wishlists
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Book Swap Policies
CREATE POLICY "Users can view their swap requests"
  ON book_swaps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE (
        (books.id = book_swaps.requester_book_id AND books.seller_id = auth.uid())
        OR
        (books.id = book_swaps.owner_book_id AND books.seller_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can create swap requests"
  ON book_swaps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = requester_book_id
      AND books.seller_id = auth.uid()
      AND books.status = 'available'
    )
  );

CREATE POLICY "Book owners can update swap status"
  ON book_swaps
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_swaps.owner_book_id
      AND books.seller_id = auth.uid()
    )
  );

-- Add trigger for updating updated_at
CREATE TRIGGER update_book_swaps_updated_at
  BEFORE UPDATE ON book_swaps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();