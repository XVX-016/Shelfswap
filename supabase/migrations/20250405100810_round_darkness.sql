/*
  # Create Books and Users Tables

  1. New Tables
    - `books`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `author` (text, not null)
      - `price` (integer, not null)
      - `condition` (text, not null)
      - `category` (text, not null)
      - `description` (text)
      - `image_url` (text)
      - `seller_id` (uuid, references users)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
      - `status` (text, default: 'available')

    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `full_name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Books Table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  price integer NOT NULL,
  condition text NOT NULL,
  category text NOT NULL,
  description text,
  image_url text,
  seller_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved'))
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create Policies for Users
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create Policies for Books
CREATE POLICY "Anyone can read available books"
  ON books
  FOR SELECT
  TO authenticated
  USING (status = 'available' OR seller_id = auth.uid());

CREATE POLICY "Users can create books"
  ON books
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update own books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();