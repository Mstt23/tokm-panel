/*
  # Admin Panel Storage Buckets

  ## Overview
  Creates storage buckets for admin panel file uploads including:
  - Documents (course materials, contracts, receipts)
  - Issue report images
  - Student/staff profile photos

  ## Buckets Created
  1. `documents` - For course documents, contracts, receipts (PDF, Excel, Word)
  2. `issue-reports` - For issue report attachments and images
  3. `profiles` - For user profile photos

  ## Security
  - RLS policies for role-based access
  - Admin and authorized users can upload
  - All authenticated users can view based on role
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('admin-documents', 'admin-documents', false),
  ('issue-reports', 'issue-reports', false),
  ('admin-profiles', 'admin-profiles', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- RLS POLICIES FOR STORAGE
-- =====================================================

-- Admin Documents: Authorized users can upload, all can view
CREATE POLICY "Authenticated users can view admin documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'admin-documents');

CREATE POLICY "Authorized users can upload admin documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff', 'teacher')
  )
);

CREATE POLICY "Admins can delete admin documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'admin-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Issue Reports: All authenticated can upload, admins and reporters can view
CREATE POLICY "Users can view their issue report images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'issue-reports' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

CREATE POLICY "Authenticated users can upload issue report images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'issue-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin Profiles: Users can upload their own, all can view
CREATE POLICY "Authenticated users can view profile photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'admin-profiles');

CREATE POLICY "Users can upload own profile photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own profile photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'admin-profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own profile photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'admin-profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
