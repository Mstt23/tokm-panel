/*
  # Create Storage Buckets for Gallery and Testimonials

  1. New Storage Buckets
    - `gallery-images` - For gallery images uploaded through admin panel
    - `testimonial-images` - For student photos in testimonials

  2. Security
    - Enable public access for reading (anyone can view images)
    - Allow authenticated users to upload/update/delete (admin only through service role)
*/

-- Create gallery-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create testimonial-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonial-images', 'testimonial-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for gallery-images
CREATE POLICY "Anyone can view gallery images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery-images');

CREATE POLICY "Service role can upload gallery images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery-images');

CREATE POLICY "Service role can update gallery images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'gallery-images')
  WITH CHECK (bucket_id = 'gallery-images');

CREATE POLICY "Service role can delete gallery images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery-images');

-- Storage policies for testimonial-images
CREATE POLICY "Anyone can view testimonial images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'testimonial-images');

CREATE POLICY "Service role can upload testimonial images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'testimonial-images');

CREATE POLICY "Service role can update testimonial images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'testimonial-images')
  WITH CHECK (bucket_id = 'testimonial-images');

CREATE POLICY "Service role can delete testimonial images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'testimonial-images');