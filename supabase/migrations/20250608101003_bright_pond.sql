/*
  # Fix RLS Policy Performance Issues

  1. Changes
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - This allows PostgreSQL to cache the auth function result
    - Improves query performance at scale

  2. Updated Policies
    - All policies that use auth.uid() will be recreated with optimized versions
*/

-- Drop existing policies that have performance issues
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Anyone can read available books" ON books;
DROP POLICY IF EXISTS "Users can create books" ON books;
DROP POLICY IF EXISTS "Users can update own books" ON books;
DROP POLICY IF EXISTS "Users can view messages for their books" ON messages;
DROP POLICY IF EXISTS "Users can send messages about books" ON messages;
DROP POLICY IF EXISTS "Users can view their friends" ON friends;
DROP POLICY IF EXISTS "Users can send friend requests" ON friends;
DROP POLICY IF EXISTS "Users can accept friend requests" ON friends;
DROP POLICY IF EXISTS "Users can manage their wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can view their swap requests" ON book_swaps;
DROP POLICY IF EXISTS "Users can create swap requests" ON book_swaps;
DROP POLICY IF EXISTS "Book owners can update swap status" ON book_swaps;
DROP POLICY IF EXISTS "Users can manage their study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Creators can update their study groups" ON study_groups;
DROP POLICY IF EXISTS "Users can join groups" ON study_group_members;
DROP POLICY IF EXISTS "Users can view their support messages" ON support_messages;
DROP POLICY IF EXISTS "Users can create support messages" ON support_messages;
DROP POLICY IF EXISTS "Users can view their own book views" ON book_views;
DROP POLICY IF EXISTS "Users can create book views" ON book_views;
DROP POLICY IF EXISTS "Users can manage their book likes" ON book_likes;

-- Recreate optimized policies for Users
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

-- Recreate optimized policies for Books
CREATE POLICY "Anyone can read available books"
  ON books
  FOR SELECT
  TO authenticated
  USING (status = 'available' OR seller_id = (select auth.uid()));

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

-- Recreate optimized policies for Messages
CREATE POLICY "Users can view messages for their books"
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

CREATE POLICY "Users can send messages about books"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_id
      AND books.status = 'available'
    )
  );

-- Recreate optimized policies for Friends
CREATE POLICY "Users can view their friends"
  ON friends
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR friend_id = (select auth.uid())
  );

CREATE POLICY "Users can send friend requests"
  ON friends
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND status = 'pending'
  );

CREATE POLICY "Users can accept friend requests"
  ON friends
  FOR UPDATE
  TO authenticated
  USING (
    friend_id = (select auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (
    status = 'accepted'
  );

-- Recreate optimized policies for Wishlists
CREATE POLICY "Users can manage their wishlists"
  ON wishlists
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Recreate optimized policies for Book Swaps
CREATE POLICY "Users can view their swap requests"
  ON book_swaps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE (
        (books.id = book_swaps.requester_book_id AND books.seller_id = (select auth.uid()))
        OR
        (books.id = book_swaps.owner_book_id AND books.seller_id = (select auth.uid()))
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
      AND books.seller_id = (select auth.uid())
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
      AND books.seller_id = (select auth.uid())
    )
  );

-- Recreate optimized policies for Study Sessions
CREATE POLICY "Users can manage their study sessions"
  ON study_sessions
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Recreate optimized policies for Study Groups
CREATE POLICY "Creators can update their study groups"
  ON study_groups
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = creator_id);

-- Recreate optimized policies for Study Group Members
CREATE POLICY "Users can join groups"
  ON study_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Recreate optimized policies for Support Messages
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

-- Recreate optimized policies for Book Views
CREATE POLICY "Users can view their own book views"
  ON book_views
  FOR SELECT
  TO authenticated
  USING (viewer_id = (select auth.uid()));

CREATE POLICY "Users can create book views"
  ON book_views
  FOR INSERT
  TO authenticated
  WITH CHECK (viewer_id = (select auth.uid()));

-- Recreate optimized policies for Book Likes
CREATE POLICY "Users can manage their book likes"
  ON book_likes
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));