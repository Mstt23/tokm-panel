/*
  # Fix About Us RLS Security Issues

  1. Security Changes
    - Drop the overly permissive "Service role can manage about us content" policy
    - This policy used USING (true) and WITH CHECK (true) which bypassed RLS
    - Keep only the restrictive public read policy for active content
    - Management will be handled through the admin interface with proper authentication
  
  2. Important Notes
    - Public users can only view active about_us records
    - Admin operations are handled through the application layer with authentication
    - No unrestricted access policies remain
*/

DROP POLICY IF EXISTS "Service role can manage about us content" ON about_us;

CREATE POLICY "Admin can manage about us content"
  ON about_us
  FOR ALL
  USING (false)
  WITH CHECK (false);