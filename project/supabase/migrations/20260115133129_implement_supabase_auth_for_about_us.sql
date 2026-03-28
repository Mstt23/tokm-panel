/*
  # Implement Supabase Auth for About Us Security

  1. Changes
    - Drop all existing insecure policies
    - Create secure policies that check authentication using auth.uid()
    - Public users can only SELECT active content
    - Authenticated users can perform all operations
  
  2. New Security Model
    - Public (anon): Can only view active about_us content
    - Authenticated users: Can INSERT, UPDATE, DELETE about_us content
    - All policies check auth.uid() to ensure user is authenticated
  
  3. Important Notes
    - This uses Supabase Auth instead of custom authentication
    - Security is now enforced at the database level
    - Only authenticated users can manage about_us content
    - No more "always true" policies that bypass security
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can read active about_us" ON about_us;
DROP POLICY IF EXISTS "Anon can insert about_us" ON about_us;
DROP POLICY IF EXISTS "Anon can update about_us" ON about_us;
DROP POLICY IF EXISTS "Anon can delete about_us" ON about_us;

-- Public can read active about_us content
CREATE POLICY "Public can read active about_us content"
  ON about_us
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can insert about_us content
CREATE POLICY "Authenticated users can insert about_us"
  ON about_us
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update about_us content
CREATE POLICY "Authenticated users can update about_us"
  ON about_us
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can delete about_us content
CREATE POLICY "Authenticated users can delete about_us"
  ON about_us
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);