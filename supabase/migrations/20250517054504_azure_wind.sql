/*
  # Add Trending Books and Message Features

  1. New Tables
    - `book_views`
      - `id` (uuid, primary key)
      - `book_id` (uuid, references books)
      - `viewer_id` (uuid, references users)
      - `viewed_at` (timestamp with time zone)

    - `book_likes`
      - `id` (uuid, primary key)
      - `book_id` (uuid, references books)
      - `user_id` (uuid, references users)
      - `created_at` (timestamp with time zone)

  2. Functions
    - `get_trending_books`: Returns books sorted by views and likes
    - `increment_book_views`: Increments view count for a book

  3. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Create Book Views Table
CREATE TABLE IF NOT EXISTS book_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(book_id, viewer_id)
);

-- Create Book Likes Table
CREATE TABLE IF NOT EXISTS book_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(book_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE book_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_likes ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own book views"
  ON book_views
  FOR SELECT
  TO authenticated
  USING (viewer_id = auth.uid());

CREATE POLICY "Users can create book views"
  ON book_views
  FOR INSERT
  TO authenticated
  WITH CHECK (viewer_id = auth.uid());

CREATE POLICY "Users can manage their book likes"
  ON book_likes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create Function to Get Trending Books
CREATE OR REPLACE FUNCTION get_trending_books(
  time_window interval DEFAULT interval '7 days'
)
RETURNS TABLE (
  book_id uuid,
  title text,
  author text,
  price integer,
  condition text,
  category text,
  image_url text,
  view_count bigint,
  like_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as book_id,
    b.title,
    b.author,
    b.price,
    b.condition,
    b.category,
    b.image_url,
    COUNT(DISTINCT bv.id) as view_count,
    COUNT(DISTINCT bl.id) as like_count
  FROM books b
  LEFT JOIN book_views bv ON b.id = bv.book_id 
    AND bv.viewed_at >= NOW() - time_window
  LEFT JOIN book_likes bl ON b.id = bl.book_id
    AND bl.created_at >= NOW() - time_window
  WHERE b.status = 'available'
  GROUP BY b.id
  ORDER BY 
    COUNT(DISTINCT bv.id) + COUNT(DISTINCT bl.id) DESC,
    b.created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;