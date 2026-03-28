/*
  # Add System Settings and Enhance Existing Schema
  
  ## Changes
  
  1. System Settings Table
    - Add configurable settings for grade levels, classrooms, subjects
    - Allow panel-based configuration updates
  
  2. Enhance Students Table
    - Add missing fields for complete student management
  
  3. Enhance Staff Table
    - Add subjects field for teachers
  
  4. Add Password Reset Requests
    - Track password reset requests from users
  
  5. Add Income/Expense Categories
    - Configurable financial categories
  
  ## Security
  - RLS enabled on all new tables
  - Admin-only access for settings
*/

-- =============================================
-- 1. SYSTEM SETTINGS
-- =============================================

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('grade_levels', '["Mezun", "12.Sınıf", "11.Sınıf", "10.Sınıf", "9.Sınıf", "8.Sınıf", "7.Sınıf", "6.Sınıf", "5.Sınıf", "4.Sınıf", "3.Sınıf", "2.Sınıf", "1.Sınıf"]'::jsonb, 'Sınıf seviyeleri'),
  ('classrooms', '["1.Derslik", "2.Derslik", "3.Derslik", "4.Derslik", "5.Derslik"]'::jsonb, 'Derslik isimleri'),
  ('subjects', '["Matematik", "Fizik", "Kimya", "Biyoloji", "Türkçe", "Tarih", "Coğrafya", "İngilizce", "Geometri", "Edebiyat"]'::jsonb, 'Ders adları'),
  ('departments', '["TYT", "AYT", "LGS", "İngilizce", "Bireysel Ders"]'::jsonb, 'Bölümler'),
  ('time_slots', '["08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00"]'::jsonb, 'Ders saatleri')
ON CONFLICT (setting_key) DO NOTHING;

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- 2. ENHANCE STUDENTS TABLE
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'student_no'
  ) THEN
    ALTER TABLE students ADD COLUMN student_no text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'group_name'
  ) THEN
    ALTER TABLE students ADD COLUMN group_course text;
  ELSE
    ALTER TABLE students RENAME COLUMN group_name TO group_course;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'private_course'
  ) THEN
    ALTER TABLE students ADD COLUMN private_course text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'private_course_fee'
  ) THEN
    ALTER TABLE students ADD COLUMN private_course_fee numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'down_payment'
  ) THEN
    ALTER TABLE students ADD COLUMN down_payment numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'additional_fee'
  ) THEN
    ALTER TABLE students ADD COLUMN additional_fee numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'additional_fee_notes'
  ) THEN
    ALTER TABLE students ADD COLUMN additional_fee_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'installment_start_date'
  ) THEN
    ALTER TABLE students ADD COLUMN installment_start_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'installment_end_date'
  ) THEN
    ALTER TABLE students ADD COLUMN installment_end_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'installment_notes'
  ) THEN
    ALTER TABLE students ADD COLUMN installment_notes text;
  END IF;
END $$;

-- =============================================
-- 3. ENHANCE STAFF TABLE
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'subjects'
  ) THEN
    ALTER TABLE staff ADD COLUMN subjects jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'other_workplaces'
  ) THEN
    ALTER TABLE staff ADD COLUMN other_workplaces text;
  ELSE
    ALTER TABLE staff RENAME COLUMN other_jobs TO other_workplaces;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'position'
  ) THEN
    ALTER TABLE staff ADD COLUMN position text;
  ELSE
    ALTER TABLE staff RENAME COLUMN role_title TO position;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'monthly_salary'
  ) THEN
    ALTER TABLE staff ADD COLUMN monthly_salary numeric(10,2) DEFAULT 0;
  ELSE
    ALTER TABLE staff RENAME COLUMN salary TO monthly_salary;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'home_address'
  ) THEN
    ALTER TABLE staff ADD COLUMN home_address text;
  ELSE
    ALTER TABLE staff RENAME COLUMN address TO home_address;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE staff ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- =============================================
-- 4. PASSWORD RESET REQUESTS
-- =============================================

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id),
  notes text
);

ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can request password reset"
  ON password_reset_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own reset requests"
  ON password_reset_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admin can process reset requests"
  ON password_reset_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- 5. INCOME/EXPENSE CATEGORIES
-- =============================================

CREATE TABLE IF NOT EXISTS income_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  subcategories jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

INSERT INTO income_categories (name, subcategories) VALUES
  ('Lise Kursu', '["Elden", "Havale", "Kredi Kartı"]'::jsonb),
  ('Ortaokul Kursu', '["Elden", "Havale", "Kredi Kartı"]'::jsonb),
  ('İngilizce Kursu', '["Elden", "Havale", "Kredi Kartı"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

INSERT INTO expense_categories (name) VALUES
  ('Faturalar'),
  ('Kira'),
  ('Şahsi'),
  ('Personel Ödemeleri'),
  ('Mutfak Gideri')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view income categories"
  ON income_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage income categories"
  ON income_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Everyone can view expense categories"
  ON expense_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage expense categories"
  ON expense_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- 6. UPDATE SCHEDULES FOR CLASS SCHEDULES
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schedules' AND column_name = 'grade_level'
  ) THEN
    ALTER TABLE schedules ADD COLUMN grade_level text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schedules' AND column_name = 'subject'
  ) THEN
    ALTER TABLE schedules ADD COLUMN subject text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schedules' AND column_name = 'classroom'
  ) THEN
    ALTER TABLE schedules ADD COLUMN classroom text;
  ELSE
    ALTER TABLE schedules RENAME COLUMN room TO classroom;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schedules' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE schedules ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schedules' AND column_name = 'time_slot'
  ) THEN
    ALTER TABLE schedules ADD COLUMN time_slot text;
  END IF;
END $$;

-- =============================================
-- 7. HELPER FUNCTIONS
-- =============================================

-- Function to check schedule conflicts
CREATE OR REPLACE FUNCTION check_schedule_conflict(
  p_day integer,
  p_time_slot text,
  p_teacher_id uuid,
  p_classroom text,
  p_schedule_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_conflict jsonb;
BEGIN
  -- Check classroom conflict
  SELECT jsonb_build_object(
    'has_conflict', true,
    'type', 'classroom',
    'message', 'Bu derslik bu saatte dolu'
  ) INTO v_conflict
  FROM schedules
  WHERE day_of_week = p_day
  AND time_slot = p_time_slot
  AND classroom = p_classroom
  AND is_active = true
  AND (p_schedule_id IS NULL OR id != p_schedule_id)
  LIMIT 1;
  
  IF v_conflict IS NOT NULL THEN
    RETURN v_conflict;
  END IF;
  
  -- Check teacher conflict
  SELECT jsonb_build_object(
    'has_conflict', true,
    'type', 'teacher',
    'message', 'Bu öğretmen bu saatte başka bir derste'
  ) INTO v_conflict
  FROM schedules
  WHERE day_of_week = p_day
  AND time_slot = p_time_slot
  AND teacher_id = p_teacher_id
  AND is_active = true
  AND (p_schedule_id IS NULL OR id != p_schedule_id)
  LIMIT 1;
  
  IF v_conflict IS NOT NULL THEN
    RETURN v_conflict;
  END IF;
  
  RETURN jsonb_build_object('has_conflict', false);
END;
$$ LANGUAGE plpgsql;

-- Function to check student schedule conflict
CREATE OR REPLACE FUNCTION check_student_schedule_conflict(
  p_student_id uuid,
  p_day integer,
  p_time_slot text,
  p_schedule_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_conflict jsonb;
  v_grade text;
BEGIN
  -- Get student's grade level
  SELECT grade INTO v_grade FROM students WHERE id = p_student_id;
  
  -- Check if student has class schedule at this time
  SELECT jsonb_build_object(
    'has_conflict', true,
    'type', 'class_schedule',
    'message', 'Öğrenci bu saatte sınıf dersinde'
  ) INTO v_conflict
  FROM schedules
  WHERE day_of_week = p_day
  AND time_slot = p_time_slot
  AND grade_level = v_grade
  AND is_active = true
  LIMIT 1;
  
  IF v_conflict IS NOT NULL THEN
    RETURN v_conflict;
  END IF;
  
  -- Check if student has another private lesson
  SELECT jsonb_build_object(
    'has_conflict', true,
    'type', 'private_lesson',
    'message', 'Öğrenci bu saatte başka bir özel derste'
  ) INTO v_conflict
  FROM schedules
  WHERE day_of_week = p_day
  AND time_slot = p_time_slot
  AND student_id = p_student_id
  AND is_active = true
  AND (p_schedule_id IS NULL OR id != p_schedule_id)
  LIMIT 1;
  
  IF v_conflict IS NOT NULL THEN
    RETURN v_conflict;
  END IF;
  
  RETURN jsonb_build_object('has_conflict', false);
END;
$$ LANGUAGE plpgsql;

-- Update existing schedules start/end time to time_slot if possible
UPDATE schedules 
SET time_slot = start_time::text || '-' || end_time::text 
WHERE time_slot IS NULL AND start_time IS NOT NULL;
