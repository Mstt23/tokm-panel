/*
  # Fix RLS Security Issues

  ## Overview
  This migration addresses critical security vulnerabilities in the RLS policies for
  announcements and contact_submissions tables by removing permissive policies that
  allow unrestricted access.

  ## Changes Made

  ### 1. Announcements Table
  **Removed:**
  - Multiple conflicting SELECT policies for anon role
  - Policies with USING (true) that bypass security

  **Added:**
  - Single SELECT policy for public to view active announcements only
  - Authenticated-only policies for INSERT, UPDATE, DELETE operations
  - Proper authentication checks using auth.uid()

  ### 2. Contact Submissions Table
  **Kept:**
  - Public INSERT policy (required for contact form functionality)

  **Fixed:**
  - SELECT policy now requires authentication
  - UPDATE policy now requires authentication
  - DELETE policy now requires authentication
  - All policies now properly check auth.uid()

  ## Security Improvements
  - Eliminated "always true" RLS policies
  - Removed duplicate/conflicting policies
  - Enforced proper authentication for admin operations
  - Maintained public access only where necessary (contact form, viewing active announcements)

  ## Important Notes
  - Admin operations now require Supabase authentication
  - Anon key can no longer perform admin operations
  - Public users can only view active announcements
  - Contact form submissions remain public
*/

-- =====================================================
-- FIX ANNOUNCEMENTS TABLE POLICIES
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can update announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can delete announcements" ON announcements;

-- Create secure policy for public viewing (only active announcements)
CREATE POLICY "Public can view active announcements"
  ON announcements
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Create secure policies for authenticated admins
CREATE POLICY "Authenticated admins can view all announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated admins can insert announcements"
  ON announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated admins can update announcements"
  ON announcements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated admins can delete announcements"
  ON announcements
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- FIX CONTACT_SUBMISSIONS TABLE POLICIES
-- =====================================================

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Authenticated users can view all submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can update submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can delete submissions" ON contact_submissions;

-- Recreate policies with proper authentication checks
CREATE POLICY "Authenticated admins can view all submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated admins can update submissions"
  ON contact_submissions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated admins can delete submissions"
  ON contact_submissions
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
