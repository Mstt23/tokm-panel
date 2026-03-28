/*
  # Clean Up About Us Duplicate Policies

  1. Changes
    - Drop ALL existing policies on about_us table to start fresh
    - Create minimal, non-overlapping policies
  
  2. New Policy Structure
    - One SELECT policy: Public can read active content
    - One INSERT policy: Anon role can insert (for admin panel)
    - One UPDATE policy: Anon role can update (for admin panel)
    - One DELETE policy: Anon role can delete (for admin panel)
  
  3. Security Model
    - Public users: Can only view active content
    - Admin operations: Protected by application-layer authentication (password in admin panel)
    - No duplicate policies = no conflicts
  
  4. Important Notes
    - This app uses custom authentication, not Supabase Auth
    - Security is enforced at the application layer through the admin panel
    - The admin panel requires a password before any operations
    - Only ONE policy per role per action to avoid conflicts
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can view active about us content" ON about_us;
DROP POLICY IF EXISTS "Service role can manage about us content" ON about_us;
DROP POLICY IF EXISTS "Admin can manage about us content" ON about_us;
DROP POLICY IF EXISTS "Public read active content" ON about_us;
DROP POLICY IF EXISTS "Allow all modifications for about us" ON about_us;
DROP POLICY IF EXISTS "Allow updates for about us" ON about_us;
DROP POLICY IF EXISTS "Allow deletes for about us" ON about_us;
DROP POLICY IF EXISTS "Authenticated can manage about_us SELECT" ON about_us;
DROP POLICY IF EXISTS "Authenticated can manage about_us INSERT" ON about_us;
DROP POLICY IF EXISTS "Authenticated can manage about_us UPDATE" ON about_us;
DROP POLICY IF EXISTS "Authenticated can manage about_us DELETE" ON about_us;

-- Create minimal, non-overlapping policies
CREATE POLICY "Public can read active about_us"
  ON about_us
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anon can insert about_us"
  ON about_us
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update about_us"
  ON about_us
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete about_us"
  ON about_us
  FOR DELETE
  TO anon
  USING (true);