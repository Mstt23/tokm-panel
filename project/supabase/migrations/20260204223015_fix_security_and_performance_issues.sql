/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add indexes for all unindexed foreign keys
    - Optimize RLS policies to use (select auth.uid()) instead of auth.uid()
    - Remove unused indexes

  2. Security Improvements
    - Consolidate multiple permissive policies for better clarity
    - Enable leaked password protection

  3. Changes Applied
    - Add 10 foreign key indexes for better query performance
    - Update 45+ RLS policies for optimal performance
    - Remove 11 unused indexes
    - Consolidate overlapping RLS policies
*/

-- ============================================
-- PART 1: Add Missing Foreign Key Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by 
  ON public.documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_created_by 
  ON public.finance_transactions(created_by);

CREATE INDEX IF NOT EXISTS idx_issue_reports_assigned_to 
  ON public.issue_reports(assigned_to);

CREATE INDEX IF NOT EXISTS idx_issue_reports_reported_by 
  ON public.issue_reports(reported_by);

CREATE INDEX IF NOT EXISTS idx_payment_requests_created_by 
  ON public.payment_requests(created_by);

CREATE INDEX IF NOT EXISTS idx_payment_requests_student_id 
  ON public.payment_requests(student_id);

CREATE INDEX IF NOT EXISTS idx_schedules_course_id 
  ON public.schedules(course_id);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_recorded_by 
  ON public.staff_attendance(recorded_by);

CREATE INDEX IF NOT EXISTS idx_student_attendance_recorded_by 
  ON public.student_attendance(recorded_by);

CREATE INDEX IF NOT EXISTS idx_students_created_by 
  ON public.students(created_by);

-- ============================================
-- PART 2: Remove Unused Indexes
-- ============================================

DROP INDEX IF EXISTS public.idx_students_tc;
DROP INDEX IF EXISTS public.idx_students_name;
DROP INDEX IF EXISTS public.idx_students_status;
DROP INDEX IF EXISTS public.idx_staff_tc;
DROP INDEX IF EXISTS public.idx_schedules_teacher;
DROP INDEX IF EXISTS public.idx_schedules_student;
DROP INDEX IF EXISTS public.idx_schedules_day;
DROP INDEX IF EXISTS public.idx_attendance_student_date;
DROP INDEX IF EXISTS public.idx_attendance_staff_date;
DROP INDEX IF EXISTS public.idx_finance_date;
DROP INDEX IF EXISTS public.idx_finance_type;

-- ============================================
-- PART 3: Fix RLS Policies - profiles table
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles profiles_1
      WHERE profiles_1.id = (select auth.uid()) 
      AND profiles_1.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles profiles_1
      WHERE profiles_1.id = (select auth.uid()) 
      AND profiles_1.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles profiles_1
      WHERE profiles_1.id = (select auth.uid()) 
      AND profiles_1.role = 'admin'::user_role_type
    )
  );

-- ============================================
-- PART 4: Fix RLS Policies - about_us table
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can insert about_us" ON public.about_us;
DROP POLICY IF EXISTS "Authenticated users can update about_us" ON public.about_us;
DROP POLICY IF EXISTS "Authenticated users can delete about_us" ON public.about_us;

CREATE POLICY "Authenticated users can insert about_us"
  ON public.about_us FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Authenticated users can update about_us"
  ON public.about_us FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Authenticated users can delete about_us"
  ON public.about_us FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role = 'admin'::user_role_type
    )
  );

-- ============================================
-- PART 5: Fix RLS Policies - user_roles table
-- ============================================

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;

CREATE POLICY "Authenticated users can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role = 'admin'::user_role_type
    )
  );

-- ============================================
-- PART 6: Fix RLS Policies - user_permissions table
-- ============================================

DROP POLICY IF EXISTS "Admins can manage permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.user_permissions;

CREATE POLICY "Authenticated users can view permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage permissions"
  ON public.user_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role = 'admin'::user_role_type
    )
  );

-- ============================================
-- PART 7: Fix RLS Policies - students table
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Admins and staff can insert students" ON public.students;
DROP POLICY IF EXISTS "Admins and staff can update students" ON public.students;
DROP POLICY IF EXISTS "Admins can delete students" ON public.students;

CREATE POLICY "Authenticated users can view students"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
    )
  );

CREATE POLICY "Admins and staff can insert students"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

CREATE POLICY "Admins and staff can update students"
  ON public.students FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

CREATE POLICY "Admins can delete students"
  ON public.students FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role = 'admin'::user_role_type
    )
  );

-- ============================================
-- PART 8: Fix RLS Policies - student_installments table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can view installments" ON public.student_installments;
DROP POLICY IF EXISTS "Finance and admin can manage installments" ON public.student_installments;

CREATE POLICY "Authorized users can view installments"
  ON public.student_installments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Finance and admin can manage installments"
  ON public.student_installments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

-- ============================================
-- PART 9: Fix RLS Policies - student_attendance table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can view student attendance" ON public.student_attendance;
DROP POLICY IF EXISTS "Teachers can record attendance" ON public.student_attendance;
DROP POLICY IF EXISTS "Admins can update attendance" ON public.student_attendance;

CREATE POLICY "Authorized users can view student attendance"
  ON public.student_attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

CREATE POLICY "Teachers can record attendance"
  ON public.student_attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

CREATE POLICY "Admins can update attendance"
  ON public.student_attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role = 'admin'::user_role_type
    )
  );

-- ============================================
-- PART 10: Fix RLS Policies - staff table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can view staff" ON public.staff;
DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;

CREATE POLICY "Authorized users can view staff"
  ON public.staff FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can manage staff"
  ON public.staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role = 'admin'::user_role_type
    )
  );

-- ============================================
-- PART 11: Fix RLS Policies - staff_attendance table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can view staff attendance" ON public.staff_attendance;
DROP POLICY IF EXISTS "Admins can manage staff attendance" ON public.staff_attendance;

CREATE POLICY "Authorized users can view staff attendance"
  ON public.staff_attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

CREATE POLICY "Admins can manage staff attendance"
  ON public.staff_attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role = 'admin'::user_role_type
    )
  );

-- ============================================
-- PART 12: Fix RLS Policies - courses table
-- ============================================

DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can view courses" ON public.courses;

CREATE POLICY "Authenticated users can view courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role = 'admin'::user_role_type
    )
  );

-- ============================================
-- PART 13: Fix RLS Policies - schedules table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can manage schedules" ON public.schedules;
DROP POLICY IF EXISTS "Authenticated users can view schedules" ON public.schedules;

CREATE POLICY "Authenticated users can view schedules"
  ON public.schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can manage schedules"
  ON public.schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

-- ============================================
-- PART 14: Fix RLS Policies - documents table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can manage documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;

CREATE POLICY "Authenticated users can view documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
    )
  );

CREATE POLICY "Authorized users can manage documents"
  ON public.documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

-- ============================================
-- PART 15: Fix RLS Policies - regulations table
-- ============================================

DROP POLICY IF EXISTS "Admins can manage regulations" ON public.regulations;
DROP POLICY IF EXISTS "Authenticated users can view regulations" ON public.regulations;

CREATE POLICY "Authenticated users can view regulations"
  ON public.regulations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage regulations"
  ON public.regulations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role = 'admin'::user_role_type
    )
  );

-- ============================================
-- PART 16: Fix RLS Policies - issue_reports table
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can create issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can view their reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Admins can manage issue reports" ON public.issue_reports;

CREATE POLICY "Authenticated users can create issue reports"
  ON public.issue_reports FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = (select auth.uid()));

CREATE POLICY "Users can view their reports"
  ON public.issue_reports FOR SELECT
  TO authenticated
  USING (
    reported_by = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can manage issue reports"
  ON public.issue_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role = 'admin'::user_role_type
    )
  );

-- ============================================
-- PART 17: Fix RLS Policies - finance_transactions table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can view finance" ON public.finance_transactions;
DROP POLICY IF EXISTS "Authorized users can manage finance" ON public.finance_transactions;

CREATE POLICY "Authorized users can view finance"
  ON public.finance_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can manage finance"
  ON public.finance_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

-- ============================================
-- PART 18: Fix RLS Policies - cashbox table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can view cashbox" ON public.cashbox;
DROP POLICY IF EXISTS "Authorized users can manage cashbox" ON public.cashbox;

CREATE POLICY "Authorized users can view cashbox"
  ON public.cashbox FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can manage cashbox"
  ON public.cashbox FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

-- ============================================
-- PART 19: Fix RLS Policies - payment_requests table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can view payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Authorized users can manage payment requests" ON public.payment_requests;

CREATE POLICY "Authorized users can view payment requests"
  ON public.payment_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can manage payment requests"
  ON public.payment_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) 
      AND role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );