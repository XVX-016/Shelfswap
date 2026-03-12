/*
  # Fix Database Security Policies

  1. Security Fixes
    - Update book_views policies to allow trending books functionality
    - Ensure book_likes policies are properly configured
    - Add missing policies for public book viewing

  2. Changes
    - Allow authenticated users to view book views for trending calculations
    - Maintain user privacy while enabling functionality
    - Fix any missing RLS policies
*/

-- Fix book_views policies to allow trending books functionality
DROP POLICY IF EXISTS "Users can view their own book views" ON book_views;
DROP POLICY IF EXISTS "Users can create book views" ON book_views;

-- Allow authenticated users to view book views (needed for trending books)
CREATE POLICY "Authenticated users can view book views"
  ON book_views
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only create their own book views
CREATE POLICY "Users can create their own book views"
  ON book_views
  FOR INSERT
  TO authenticated
  WITH CHECK (viewer_id = (select auth.uid()));

-- Ensure book_likes policies are correct
DROP POLICY IF EXISTS "Users can manage their book likes" ON book_likes;

-- Allow authenticated users to view book likes (needed for trending books)
CREATE POLICY "Authenticated users can view book likes"
  ON book_likes
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only manage their own likes
CREATE POLICY "Users can manage their own book likes"
  ON book_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own book likes"
  ON book_likes
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Ensure books table has proper public read access for trending functionality
DROP POLICY IF EXISTS "Anyone can read books" ON books;

CREATE POLICY "Public can read available books"
  ON books
  FOR SELECT
  TO authenticated
  USING (status = 'available');

CREATE POLICY "Users can read their own books"
  ON books
  FOR SELECT
  TO authenticated
  USING (seller_id = (select auth.uid()));

-- Add policy for users table to allow public profile viewing (needed for book seller info)
DROP POLICY IF EXISTS "Public can view user profiles" ON users;

CREATE POLICY "Public can view basic user profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_book_views_book_id ON book_views(book_id);
CREATE INDEX IF NOT EXISTS idx_book_views_viewer_id ON book_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_book_likes_book_id ON book_likes(book_id);
CREATE INDEX IF NOT EXISTS idx_book_likes_user_id ON book_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_books_seller_id ON books(seller_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);