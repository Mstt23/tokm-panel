/*
  # Final Security Fix for About Us Table

  1. Changes
    - Drop all existing policies on about_us table
    - Create only one policy: public read access for active content
    - Service role bypasses RLS automatically, so no special policy needed
  
  2. Security Model
    - Public users: Can only SELECT active content
    - Service role: Bypasses RLS completely (used by admin panel)
    - No overly permissive policies
*/

DROP POLICY IF EXISTS "Public can view active about us content" ON about_us;
DROP POLICY IF EXISTS "Service role can manage about us content" ON about_us;
DROP POLICY IF EXISTS "Admin can manage about us content" ON about_us;

CREATE POLICY "Public read active content"
  ON about_us
  FOR SELECT
  USING (is_active = true);
