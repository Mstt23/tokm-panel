/*
  # Fix Announcements RLS Policies

  1. Changes
    - Update SELECT policy to allow viewing all announcements (not just active)
    - Update policies to allow anon role to perform admin operations
  
  2. Security
    - RLS remains enabled
    - Anon key can perform CRUD operations for admin panel
    - Public can view active announcements via separate policy
*/

DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can update announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can delete announcements" ON announcements;

CREATE POLICY "Public can view active announcements"
  ON announcements
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Admin can view all announcements"
  ON announcements
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admin can insert announcements"
  ON announcements
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Admin can update announcements"
  ON announcements
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete announcements"
  ON announcements
  FOR DELETE
  TO anon
  USING (true);
