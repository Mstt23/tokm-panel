/*
  # Fix Final Security Issues

  ## Issues Fixed

  1. **Multiple Permissive Policies - announcements**
     - Remove "Public can view active announcements" for authenticated users
     - Keep public access only for anon users
     - Authenticated users get separate policy

  2. **Multiple Permissive Policies - contact_submissions**
     - Remove duplicate INSERT policies
     - Keep only one INSERT policy with proper validation

  3. **RLS Policy Always True - contact_submissions**
     - Replace "WITH CHECK (true)" with actual validation
     - Require name, grade, phone, and message fields to be non-empty
     - Prevent spam submissions with empty data

  ## Security Improvements
  - Eliminate policy conflicts for authenticated users
  - Add input validation to prevent empty submissions
  - Maintain proper access control separation
*/

-- ============================================================================
-- ANNOUNCEMENTS TABLE - Fix Multiple SELECT Policies
-- ============================================================================

-- Drop the conflicting public policy
DROP POLICY IF EXISTS "Public can view active announcements" ON announcements;

-- Recreate for anon users only (no conflict with authenticated)
CREATE POLICY "Anon can view active announcements"
  ON announcements
  FOR SELECT
  TO anon
  USING (is_active = true);

-- ============================================================================
-- CONTACT_SUBMISSIONS TABLE - Fix Multiple INSERT Policies
-- ============================================================================

-- Drop ALL existing INSERT policies to start clean
DROP POLICY IF EXISTS "Anyone can submit contact form" ON contact_submissions;
DROP POLICY IF EXISTS "Public users can submit contact form" ON contact_submissions;
DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON contact_submissions;

-- Create single INSERT policy with proper validation
CREATE POLICY "Public can submit valid contact form"
  ON contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Validate required fields are not empty
    name IS NOT NULL AND 
    trim(name) != '' AND
    grade IS NOT NULL AND 
    trim(grade) != '' AND
    phone IS NOT NULL AND 
    trim(phone) != '' AND
    message IS NOT NULL AND 
    trim(message) != '' AND
    -- Prevent excessively long inputs (basic DoS protection)
    length(name) <= 100 AND
    length(grade) <= 50 AND
    length(phone) <= 20 AND
    length(message) <= 5000
  );