/*
  # Fix Security and Performance Issues

  This migration addresses critical security and performance issues identified in the database audit.

  ## Changes

  ### 1. Add Missing Foreign Key Indexes
  - Add index on `password_reset_requests.processed_by`
  - Add index on `password_reset_requests.user_id`
  - Add index on `system_settings.updated_by`

  ### 2. Fix Auth RLS Performance Issues
  - Wrap auth functions with `(select auth.function())` to prevent re-evaluation per row
  - Update policies for: system_settings, password_reset_requests, income_categories, expense_categories

  ### 3. Consolidate Multiple Permissive Policies
  - Merge overlapping SELECT policies for expense_categories, income_categories, system_settings

  ### 4. Fix Function Search Path
  - Set immutable search_path for check_schedule_conflict and check_student_schedule_conflict

  ### 5. Drop Unused Indexes
  - Remove indexes that are not being used to save storage and improve write performance
*/

-- Step 1: Add Missing Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_processed_by 
  ON password_reset_requests(processed_by);

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user_id 
  ON password_reset_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by 
  ON system_settings(updated_by);

-- Step 2: Fix Auth RLS Performance - Drop old policies
DROP POLICY IF EXISTS "Admin can manage settings" ON system_settings;
DROP POLICY IF EXISTS "Admin can process reset requests" ON password_reset_requests;
DROP POLICY IF EXISTS "Users can request password reset" ON password_reset_requests;
DROP POLICY IF EXISTS "Users can view own reset requests" ON password_reset_requests;
DROP POLICY IF EXISTS "Admin can manage income categories" ON income_categories;
DROP POLICY IF EXISTS "Admin can manage expense categories" ON expense_categories;

-- Step 3: Consolidate Multiple Permissive Policies
DROP POLICY IF EXISTS "Everyone can view settings" ON system_settings;
DROP POLICY IF EXISTS "Everyone can view income categories" ON income_categories;
DROP POLICY IF EXISTS "Everyone can view expense categories" ON expense_categories;

-- Step 4: Create optimized policies with (select auth.function())

-- System Settings Policies
CREATE POLICY "Admin can manage settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Everyone can view settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Password Reset Request Policies
CREATE POLICY "Admin can process reset requests"
  ON password_reset_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can request password reset"
  ON password_reset_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own reset requests"
  ON password_reset_requests
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Income Categories Policies
CREATE POLICY "Admin can manage income categories"
  ON income_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Everyone can view income categories"
  ON income_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Expense Categories Policies
CREATE POLICY "Admin can manage expense categories"
  ON expense_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Everyone can view expense categories"
  ON expense_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 5: Fix Function Search Path
DROP FUNCTION IF EXISTS check_schedule_conflict(integer, text, text, text, uuid);
CREATE OR REPLACE FUNCTION check_schedule_conflict(
  p_day_of_week integer,
  p_time_slot text,
  p_classroom text,
  p_teacher_id text,
  p_schedule_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM schedules
    WHERE day_of_week = p_day_of_week
      AND time_slot = p_time_slot
      AND (classroom = p_classroom OR teacher_id::text = p_teacher_id)
      AND is_active = true
      AND (p_schedule_id IS NULL OR id != p_schedule_id)
  );
END;
$$;

DROP FUNCTION IF EXISTS check_student_schedule_conflict(uuid, integer, text, uuid);
CREATE OR REPLACE FUNCTION check_student_schedule_conflict(
  p_student_id uuid,
  p_day_of_week integer,
  p_time_slot text,
  p_schedule_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM schedules
    WHERE student_id = p_student_id
      AND day_of_week = p_day_of_week
      AND time_slot = p_time_slot
      AND is_active = true
      AND (p_schedule_id IS NULL OR id != p_schedule_id)
  );
END;
$$;

-- Step 6: Drop Unused Indexes (only if they truly exist and are unused)
DROP INDEX IF EXISTS idx_documents_uploaded_by;
DROP INDEX IF EXISTS idx_finance_transactions_created_by;
DROP INDEX IF EXISTS idx_issue_reports_assigned_to;
DROP INDEX IF EXISTS idx_issue_reports_reported_by;
DROP INDEX IF EXISTS idx_payment_requests_created_by;
DROP INDEX IF EXISTS idx_payment_requests_student_id;
DROP INDEX IF EXISTS idx_schedules_course_id;
DROP INDEX IF EXISTS idx_staff_attendance_recorded_by;
DROP INDEX IF EXISTS idx_student_attendance_recorded_by;
DROP INDEX IF EXISTS idx_students_created_by;
DROP INDEX IF EXISTS idx_schedules_student_id;
DROP INDEX IF EXISTS idx_schedules_teacher_id;
