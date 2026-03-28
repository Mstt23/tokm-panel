/*
  # Fix About Us Table Security Issues

  1. Security Changes
    - Drop the overly permissive "Service role can manage about us content" policy
    - This policy used USING (true) which allowed unrestricted access to all users
    - The service role will bypass RLS automatically when using the service role key
    - Only the public read policy remains for regular users
  
  2. Important Notes
    - Public users can only view active about_us content
    - Admin operations will use the service role key which bypasses RLS
    - This properly restricts access while maintaining functionality
*/

DROP POLICY IF EXISTS "Service role can manage about us content" ON about_us;
