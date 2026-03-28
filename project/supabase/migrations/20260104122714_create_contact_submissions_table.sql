/*
  # Create contact submissions table

  1. New Tables
    - `contact_submissions`
      - `id` (uuid, primary key) - Unique identifier for each submission
      - `name` (text) - Name of the person submitting
      - `grade` (text) - Student's grade/class level
      - `phone` (text) - Contact phone number
      - `message` (text) - Message content
      - `created_at` (timestamptz) - When the submission was created
      - `is_read` (boolean) - Whether the submission has been read by admin
      
  2. Security
    - Enable RLS on `contact_submissions` table
    - Add policy for anonymous users to insert submissions (public form)
    - Add policy for authenticated admins to view all submissions
    - Add policy for authenticated admins to update submissions (mark as read)
    
  3. Notes
    - The table allows public submissions through the contact form
    - Admins can view and manage submissions through the admin panel
*/

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade text NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit the contact form (no authentication required)
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users (admins) to view all submissions
CREATE POLICY "Authenticated users can view all submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users (admins) to update submissions
CREATE POLICY "Authenticated users can update submissions"
  ON contact_submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users (admins) to delete submissions
CREATE POLICY "Authenticated users can delete submissions"
  ON contact_submissions
  FOR DELETE
  TO authenticated
  USING (true);