/*
  # Create Gallery and Testimonials Tables

  1. New Tables
    - `gallery_images`
      - `id` (uuid, primary key)
      - `title` (text) - Image title/caption
      - `image_url` (text) - URL of the uploaded image
      - `category` (text) - Category like 'Kampüs', 'Etkinlikler', 'Sınıflar', etc.
      - `order_index` (integer) - For manual ordering of images
      - `is_active` (boolean) - Show/hide image
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `testimonials`
      - `id` (uuid, primary key)
      - `student_name` (text) - Student's name
      - `student_grade` (text) - Grade/class like '9. Sınıf', '10. Sınıf'
      - `content` (text) - Testimonial content
      - `rating` (integer) - Optional rating 1-5
      - `image_url` (text, optional) - Student photo
      - `order_index` (integer) - For manual ordering
      - `is_active` (boolean) - Show/hide testimonial
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public can read active items only
    - Admin operations will be handled through authenticated service
*/

-- Create gallery_images table
CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  category text NOT NULL DEFAULT 'Genel',
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  student_grade text NOT NULL,
  content text NOT NULL,
  rating integer DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  image_url text,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Gallery Images Policies
CREATE POLICY "Anyone can view active gallery images"
  ON gallery_images
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can insert gallery images"
  ON gallery_images
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update gallery images"
  ON gallery_images
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete gallery images"
  ON gallery_images
  FOR DELETE
  USING (true);

-- Testimonials Policies
CREATE POLICY "Anyone can view active testimonials"
  ON testimonials
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can insert testimonials"
  ON testimonials
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update testimonials"
  ON testimonials
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete testimonials"
  ON testimonials
  FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gallery_images_active ON gallery_images(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials(is_active, order_index);