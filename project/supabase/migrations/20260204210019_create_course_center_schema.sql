/*
  # Course Center Management System - Complete Database Schema

  ## Overview
  Creates all tables for a comprehensive course center management system including
  students, staff, courses, schedules, finances, attendance, and role-based access control.

  ## Tables Created
  
  ### 1. User Roles & Permissions
    - `user_roles` - Defines available roles (admin, finance, staff, teacher, student)
    - `user_permissions` - Maps permissions to roles
    - `profiles` - Extended user profile data linked to auth.users
  
  ### 2. Student Management
    - `students` - Complete student information including personal, education, and payment details
    - `student_installments` - Payment installment tracking
    - `student_attendance` - Daily attendance records
  
  ### 3. Staff Management
    - `staff` - Staff member information including contracts and salaries
    - `staff_attendance` - Staff attendance tracking
  
  ### 4. Course Management
    - `courses` - Course definitions (subjects, grades)
    - `schedules` - Weekly schedule with teacher assignments
    - `documents` - Course documents and materials
    - `regulations` - Institution regulations
    - `issue_reports` - Problem reporting system
  
  ### 5. Financial Management
    - `finance_transactions` - All income and expense records
    - `cashbox` - Cash balance tracking
    - `payment_requests` - Payment reminder system
  
  ## Security
  - RLS enabled on all tables
  - Role-based access policies
  - Admin-only modification policies for sensitive data
*/

-- Create enum types
CREATE TYPE user_role_type AS ENUM ('admin', 'finance', 'staff', 'teacher', 'student');
CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'card');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'excused', 'leave');

-- =====================================================
-- USER ROLES & PERMISSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role_type UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role_type NOT NULL REFERENCES user_roles(role),
  resource text NOT NULL,
  can_view boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, resource)
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  role user_role_type NOT NULL DEFAULT 'student',
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- STUDENT MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tc_no text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  birth_date date,
  address text,
  
  -- Education Info
  school_name text,
  grade text,
  department text,
  group_name text,
  has_private_lesson boolean DEFAULT false,
  
  -- Parent Info
  parent_name text,
  parent_phone text,
  parent_email text,
  
  -- Payment Info
  total_fee numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  remaining_amount numeric DEFAULT 0,
  installment_count integer DEFAULT 1,
  
  -- Registration
  registration_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active',
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS student_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  payment_method payment_method,
  is_paid boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, installment_number)
);

CREATE TABLE IF NOT EXISTS student_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  status attendance_status NOT NULL DEFAULT 'present',
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

-- =====================================================
-- STAFF MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tc_no text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date,
  phone text,
  email text,
  address text,
  role_title text,
  salary numeric DEFAULT 0,
  other_jobs text,
  hire_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date date NOT NULL,
  status attendance_status NOT NULL DEFAULT 'present',
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, date)
);

-- =====================================================
-- COURSE MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade text,
  department text,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES staff(id),
  student_id uuid REFERENCES students(id),
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  category text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS regulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  file_path text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS issue_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image_path text,
  status text DEFAULT 'pending',
  reported_by uuid REFERENCES auth.users(id),
  assigned_to uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- FINANCIAL MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type transaction_type NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  payment_method payment_method,
  description text,
  reference_id uuid,
  reference_type text,
  transaction_date date DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cashbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  opening_balance numeric DEFAULT 0,
  closing_balance numeric DEFAULT 0,
  total_income numeric DEFAULT 0,
  total_expense numeric DEFAULT 0,
  withdrawals numeric DEFAULT 0,
  withdrawal_reason text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  due_date date,
  message text,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  paid_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_students_tc ON students(tc_no);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_staff_tc ON staff(tc_no);
CREATE INDEX IF NOT EXISTS idx_schedules_teacher ON schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedules_student ON schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON student_attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON staff_attendance(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_finance_date ON finance_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_type ON finance_transactions(type);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - ADMIN HAS FULL ACCESS
-- =====================================================

-- Profiles: Users can view their own, admins can view all
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Roles: Authenticated users can view, only admins can modify
CREATE POLICY "Authenticated users can view roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Permissions: Authenticated users can view their permissions
CREATE POLICY "Authenticated users can view permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage permissions"
  ON user_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students: Role-based access
CREATE POLICY "Authenticated users can view students"
  ON students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance', 'staff', 'teacher')
    )
  );

CREATE POLICY "Admins and staff can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins and staff can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can delete students"
  ON students FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Student Installments: Similar to students
CREATE POLICY "Authorized users can view installments"
  ON student_installments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance', 'staff')
    )
  );

CREATE POLICY "Finance and admin can manage installments"
  ON student_installments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

-- Attendance: Teachers can view and record, admins can edit
CREATE POLICY "Authorized users can view student attendance"
  ON student_attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'staff')
    )
  );

CREATE POLICY "Teachers can record attendance"
  ON student_attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Admins can update attendance"
  ON student_attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Staff: Admin and finance can view
CREATE POLICY "Authorized users can view staff"
  ON staff FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admins can manage staff"
  ON staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Staff Attendance
CREATE POLICY "Authorized users can view staff attendance"
  ON staff_attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Admins can manage staff attendance"
  ON staff_attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Courses: All authenticated users can view
CREATE POLICY "Authenticated users can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage courses"
  ON courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Schedules: All authenticated can view, teachers and admins can modify
CREATE POLICY "Authenticated users can view schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can manage schedules"
  ON schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'staff')
    )
  );

-- Documents: All authenticated can view, admins can manage
CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can upload documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'staff')
    )
  );

CREATE POLICY "Admins can manage documents"
  ON documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Regulations: All can view, admins can manage
CREATE POLICY "Authenticated users can view regulations"
  ON regulations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage regulations"
  ON regulations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Issue Reports: All can create, assigned users and admins can view
CREATE POLICY "Authenticated users can create issue reports"
  ON issue_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view their reports"
  ON issue_reports FOR SELECT
  TO authenticated
  USING (
    auth.uid() = reported_by OR
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage issue reports"
  ON issue_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Finance: Finance and admin can view/manage
CREATE POLICY "Authorized users can view finance"
  ON finance_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Authorized users can manage finance"
  ON finance_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

-- Cashbox
CREATE POLICY "Authorized users can view cashbox"
  ON cashbox FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

CREATE POLICY "Authorized users can manage cashbox"
  ON cashbox FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

-- Payment Requests
CREATE POLICY "Authorized users can view payment requests"
  ON payment_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance', 'staff')
    )
  );

CREATE POLICY "Authorized users can manage payment requests"
  ON payment_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default roles
INSERT INTO user_roles (role, description) VALUES
  ('admin', 'Full system access'),
  ('finance', 'Financial management and reporting'),
  ('staff', 'Student and course management'),
  ('teacher', 'Teaching and attendance tracking'),
  ('student', 'Limited access to own data')
ON CONFLICT (role) DO NOTHING;

-- Insert default permissions for admin
INSERT INTO user_permissions (role, resource, can_view, can_edit, can_delete) VALUES
  ('admin', 'students', true, true, true),
  ('admin', 'staff', true, true, true),
  ('admin', 'courses', true, true, true),
  ('admin', 'finance', true, true, true),
  ('admin', 'users', true, true, true),
  ('finance', 'students', true, false, false),
  ('finance', 'finance', true, true, false),
  ('staff', 'students', true, true, false),
  ('staff', 'courses', true, true, false),
  ('teacher', 'students', true, false, false),
  ('teacher', 'courses', true, false, false)
ON CONFLICT (role, resource) DO NOTHING;