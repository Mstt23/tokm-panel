/*
  # Fix RLS Performance and Security Issues

  ## Changes Made
  
  1. **Performance Optimization**
     - Wrap all `auth.<function>()` calls with `(select auth.<function>())` to prevent re-evaluation per row
  
  2. **Remove Duplicate Policies**
     - Remove older duplicate policies from announcements and contact_submissions tables
     - Keep only the most secure versions
  
  3. **Fix Overly Permissive Policies**
     - Remove "always true" policies for gallery_images and testimonials
     - Service role bypasses RLS anyway, so these policies are unnecessary
  
  ## Tables Affected
  - announcements
  - contact_submissions
  - gallery_images
  - testimonials
*/

-- ============================================================================
-- ANNOUNCEMENTS TABLE - Clean up and fix policies
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Public users can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can update announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated users can delete announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated admins can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated admins can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated admins can update announcements" ON announcements;
DROP POLICY IF EXISTS "Authenticated admins can delete announcements" ON announcements;

-- Create optimized policies (single set, no duplicates)
CREATE POLICY "Public can view active announcements"
  ON announcements
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated can manage announcements SELECT"
  ON announcements
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can manage announcements INSERT"
  ON announcements
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can manage announcements UPDATE"
  ON announcements
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can manage announcements DELETE"
  ON announcements
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================================
-- CONTACT_SUBMISSIONS TABLE - Clean up and fix policies
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can view submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can update contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can delete contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated admins can view all submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated admins can update submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated admins can delete submissions" ON contact_submissions;

-- Create optimized policies
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated can manage submissions SELECT"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can manage submissions UPDATE"
  ON contact_submissions
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can manage submissions DELETE"
  ON contact_submissions
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================================
-- GALLERY_IMAGES TABLE - Remove unnecessary service role policies
-- ============================================================================

-- Drop overly permissive policies (service role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role can insert gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Service role can update gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Service role can delete gallery images" ON gallery_images;

-- Keep only the public read policy
-- Add authenticated user management policies
CREATE POLICY "Authenticated can manage gallery INSERT"
  ON gallery_images
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can manage gallery UPDATE"
  ON gallery_images
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can manage gallery DELETE"
  ON gallery_images
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================================
-- TESTIMONIALS TABLE - Remove unnecessary service role policies
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Service role can insert testimonials" ON testimonials;
DROP POLICY IF EXISTS "Service role can update testimonials" ON testimonials;
DROP POLICY IF EXISTS "Service role can delete testimonials" ON testimonials;

-- Add authenticated user management policies
CREATE POLICY "Authenticated can manage testimonials INSERT"
  ON testimonials
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can manage testimonials UPDATE"
  ON testimonials
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can manage testimonials DELETE"
  ON testimonials
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);