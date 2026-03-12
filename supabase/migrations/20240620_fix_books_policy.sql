-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Public can read available books" ON books;

-- Add the improved policy
CREATE POLICY "Anyone can read available books or their own books"
  ON books
  FOR SELECT
  TO authenticated
  USING (status = 'available' OR seller_id = (select auth.uid())); 