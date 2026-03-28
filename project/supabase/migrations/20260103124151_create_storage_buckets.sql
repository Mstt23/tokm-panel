/*
  # Create Storage Buckets for File Management

  1. Storage Buckets
    - `announcements-images` - Images for announcements and news
    - `documents` - Course materials, schedules, PDFs
    - `gallery` - Photo gallery of events and activities

  2. Security Policies
    - Public read access for all buckets (content is public)
    - Authenticated write access for uploads
    - Proper file type restrictions

  3. Updates to Announcements Table
    - Add `image_url` column to store announcement images
*/

-- Add image_url column to announcements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE announcements ADD COLUMN image_url text;
  END IF;
END $$;

-- Insert storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'announcements-images',
    'announcements-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'documents',
    'documents',
    true,
    10485760,
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  ),
  (
    'gallery',
    'gallery',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- Storage policies for announcements-images bucket
CREATE POLICY "Public read access for announcement images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'announcements-images');

CREATE POLICY "Authenticated users can upload announcement images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'announcements-images');

CREATE POLICY "Authenticated users can update announcement images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'announcements-images');

CREATE POLICY "Authenticated users can delete announcement images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'announcements-images');

-- Storage policies for documents bucket
CREATE POLICY "Public read access for documents"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

-- Storage policies for gallery bucket
CREATE POLICY "Public read access for gallery"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can upload to gallery"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can update gallery"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can delete from gallery"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'gallery');

-- Update existing announcements with placeholder images (optional)
UPDATE announcements
SET image_url = NULL
WHERE image_url IS NULL;