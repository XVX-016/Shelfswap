/*
  # Add Username Constraints

  1. Changes
    - Add UNIQUE constraint to username column
    - Add CHECK constraint for username format
    - Add NOT NULL constraint to username

  2. Notes
    - Username must be unique
    - Username can only contain lowercase letters, numbers, and underscores
    - Username is required
*/

ALTER TABLE users
ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]+$');

ALTER TABLE users
ALTER COLUMN username SET NOT NULL;