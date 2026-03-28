/*
  # Consolidate Overlapping RLS Policies

  1. Issue
    - Multiple tables have overlapping permissive policies for the same action
    - Policies using FOR ALL create conflicts with specific action policies
    - This causes security warnings and potential performance issues

  2. Solution
    - Split "FOR ALL" policies into specific SELECT, INSERT, UPDATE, DELETE policies
    - Remove overlapping policies by consolidating logic
    - Ensure only one policy per action per table

  3. Changes
    - Fix policies for: documents, issue_reports, profiles, cashbox, courses
    - Fix policies for: finance_transactions, payment_requests, regulations
    - Fix policies for: schedules, staff, staff_attendance, student_installments
    - Fix policies for: user_permissions, user_roles
*/

-- ============================================
-- documents table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can manage documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;

CREATE POLICY "Users can view documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
    )
  );

CREATE POLICY "Authorized users can insert documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can update documents"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can delete documents"
  ON public.documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

-- ============================================
-- issue_reports table
-- ============================================

DROP POLICY IF EXISTS "Admins can manage issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Authenticated users can create issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can view their reports" ON public.issue_reports;

CREATE POLICY "Users can view their reports"
  ON public.issue_reports FOR SELECT
  TO authenticated
  USING (
    reported_by = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Users can create reports"
  ON public.issue_reports FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = (select auth.uid()));

CREATE POLICY "Admins can update reports"
  ON public.issue_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can delete reports"
  ON public.issue_reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

-- ============================================
-- cashbox table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can view cashbox" ON public.cashbox;
DROP POLICY IF EXISTS "Authorized users can manage cashbox" ON public.cashbox;

CREATE POLICY "Authorized users can view cashbox"
  ON public.cashbox FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can insert cashbox"
  ON public.cashbox FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can update cashbox"
  ON public.cashbox FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can delete cashbox"
  ON public.cashbox FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

-- ============================================
-- courses table
-- ============================================

DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can view courses" ON public.courses;

CREATE POLICY "Users can view courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can update courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can delete courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

-- ============================================
-- finance_transactions table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can view finance" ON public.finance_transactions;
DROP POLICY IF EXISTS "Authorized users can manage finance" ON public.finance_transactions;

CREATE POLICY "Authorized users can view finance"
  ON public.finance_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can insert finance"
  ON public.finance_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can update finance"
  ON public.finance_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can delete finance"
  ON public.finance_transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

-- ============================================
-- payment_requests table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can view payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Authorized users can manage payment requests" ON public.payment_requests;

CREATE POLICY "Authorized users can view payment requests"
  ON public.payment_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can insert payment requests"
  ON public.payment_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can update payment requests"
  ON public.payment_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can delete payment requests"
  ON public.payment_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

-- ============================================
-- regulations table
-- ============================================

DROP POLICY IF EXISTS "Admins can manage regulations" ON public.regulations;
DROP POLICY IF EXISTS "Authenticated users can view regulations" ON public.regulations;

CREATE POLICY "Users can view regulations"
  ON public.regulations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert regulations"
  ON public.regulations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can update regulations"
  ON public.regulations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can delete regulations"
  ON public.regulations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

-- ============================================
-- schedules table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can manage schedules" ON public.schedules;
DROP POLICY IF EXISTS "Authenticated users can view schedules" ON public.schedules;

CREATE POLICY "Users can view schedules"
  ON public.schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can insert schedules"
  ON public.schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can update schedules"
  ON public.schedules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

CREATE POLICY "Authorized users can delete schedules"
  ON public.schedules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

-- ============================================
-- staff table
-- ============================================

DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Authorized users can view staff" ON public.staff;

CREATE POLICY "Users can view staff"
  ON public.staff FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can insert staff"
  ON public.staff FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can update staff"
  ON public.staff FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can delete staff"
  ON public.staff FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

-- ============================================
-- staff_attendance table
-- ============================================

DROP POLICY IF EXISTS "Admins can manage staff attendance" ON public.staff_attendance;
DROP POLICY IF EXISTS "Authorized users can view staff attendance" ON public.staff_attendance;

CREATE POLICY "Authorized users can view staff attendance"
  ON public.staff_attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'staff'::user_role_type)
    )
  );

CREATE POLICY "Admins can insert staff attendance"
  ON public.staff_attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can update staff attendance"
  ON public.staff_attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can delete staff attendance"
  ON public.staff_attendance FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

-- ============================================
-- student_installments table
-- ============================================

DROP POLICY IF EXISTS "Authorized users can view installments" ON public.student_installments;
DROP POLICY IF EXISTS "Finance and admin can manage installments" ON public.student_installments;

CREATE POLICY "Authorized users can view installments"
  ON public.student_installments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Finance and admin can insert installments"
  ON public.student_installments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Finance and admin can update installments"
  ON public.student_installments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

CREATE POLICY "Finance and admin can delete installments"
  ON public.student_installments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin'::user_role_type, 'finance'::user_role_type)
    )
  );

-- ============================================
-- user_permissions table
-- ============================================

DROP POLICY IF EXISTS "Admins can manage permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.user_permissions;

CREATE POLICY "Users can view permissions"
  ON public.user_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert permissions"
  ON public.user_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can update permissions"
  ON public.user_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can delete permissions"
  ON public.user_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

-- ============================================
-- user_roles table
-- ============================================

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;

CREATE POLICY "Users can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'::user_role_type
    )
  );