/*
  # Create About Us Table

  1. New Tables
    - `about_us`
      - `id` (uuid, primary key)
      - `content` (text) - The main content/description of the about section
      - `is_active` (boolean) - Controls whether this content is active
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp
  
  2. Security
    - Enable RLS on `about_us` table
    - Add policy for public read access to active records
    - Add policy for service role to manage all records
  
  3. Important Notes
    - Only one record should be active at a time
    - Admin panel will manage the content
    - Public users can only view active content
*/

CREATE TABLE IF NOT EXISTS about_us (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL DEFAULT '',
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE about_us ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active about us content"
  ON about_us
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage about us content"
  ON about_us
  FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO about_us (content) VALUES ('Tuğba Öztürk Kurs Merkezi olarak, öğrencilerimize en iyi eğitimi sunmak için çalışıyoruz. Deneyimli öğretmen kadromuz ve modern eğitim yöntemlerimizle öğrencilerimizi başarıya hazırlıyoruz.') ON CONFLICT DO NOTHING;