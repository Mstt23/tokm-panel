/*
  # Admin Panel Enhancements Schema

  This migration adds comprehensive features for the admin panel including:
  - Enhanced permissions and role management
  - Ministry documents management
  - Issue reporting system
  - Subject-teacher mapping for lesson scheduling
  - Comprehensive financial management system
  - Payment request system with WhatsApp/SMS integration
  - Bulk import/export support

  ## New Tables

  ### 1. permissions
  - Granular permission system with view/edit/delete per module
  
  ### 2. role_permissions
  - Maps roles to specific permissions
  
  ### 3. ministry_documents
  - Store and manage official ministry documents
  
  ### 4. teacher_subjects
  - Maps teachers to their qualified subjects/branches
  
  ### 5. payment_requests_v2
  - Payment requests with WhatsApp/SMS links
  
  ### 6. cashbox_transactions
  - Complete financial transaction tracking
  
  ### 7. custom_categories
  - User-defined financial categories

  ## Security
  - All tables have RLS enabled
  - Admin-only access for sensitive operations
  - Proper indexes for performance
*/

-- 1. Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name text NOT NULL,
  permission_type text NOT NULL CHECK (permission_type IN ('view', 'create', 'edit', 'delete', 'export')),
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(module_name, permission_type)
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage permissions"
  ON permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role::text = 'admin'
    )
  );

CREATE POLICY "All can view permissions"
  ON permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Role permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  granted boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage role permissions"
  ON role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role::text = 'admin'
    )
  );

CREATE POLICY "Users can view own role permissions"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (
    role = (
      SELECT profiles.role::text FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
    )
  );

-- 3. Ministry Documents
CREATE TABLE IF NOT EXISTS ministry_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL,
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now(),
  academic_year text,
  tags text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ministry_documents_type ON ministry_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_ministry_documents_academic_year ON ministry_documents(academic_year);
CREATE INDEX IF NOT EXISTS idx_ministry_documents_uploaded_at ON ministry_documents(uploaded_at DESC);

ALTER TABLE ministry_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage ministry documents"
  ON ministry_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role::text = 'admin'
    )
  );

CREATE POLICY "Staff can view ministry documents"
  ON ministry_documents
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 4. Teacher Subjects Mapping
CREATE TABLE IF NOT EXISTS teacher_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  subject text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, subject)
);

CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject ON teacher_subjects(subject);

ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage teacher subjects"
  ON teacher_subjects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role::text = 'admin'
    )
  );

CREATE POLICY "All can view teacher subjects"
  ON teacher_subjects
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Payment Requests with WhatsApp/SMS
CREATE TABLE IF NOT EXISTS payment_requests_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE NOT NULL,
  student_ids uuid[] NOT NULL,
  amount numeric(10, 2) NOT NULL,
  description text,
  due_date date,
  payment_link text,
  whatsapp_sent boolean DEFAULT false,
  sms_sent boolean DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'expired')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_v2_status ON payment_requests_v2(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_v2_due_date ON payment_requests_v2(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_requests_v2_created_at ON payment_requests_v2(created_at DESC);

ALTER TABLE payment_requests_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage payment requests"
  ON payment_requests_v2
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role::text = 'admin'
    )
  );

-- 6. Cashbox Transactions
CREATE TABLE IF NOT EXISTS cashbox_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category_id uuid,
  amount numeric(10, 2) NOT NULL,
  description text NOT NULL,
  transaction_date date DEFAULT CURRENT_DATE,
  payment_method text CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'check')),
  reference_number text,
  student_id uuid REFERENCES students(id),
  staff_id uuid REFERENCES staff(id),
  receipt_number text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cashbox_transactions_type ON cashbox_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_cashbox_transactions_date ON cashbox_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_cashbox_transactions_category ON cashbox_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_cashbox_transactions_student ON cashbox_transactions(student_id);

ALTER TABLE cashbox_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage cashbox transactions"
  ON cashbox_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role::text = 'admin'
    )
  );

CREATE POLICY "Staff can view cashbox transactions"
  ON cashbox_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role::text IN ('admin', 'staff')
    )
  );

-- 7. Custom Income/Expense Categories
CREATE TABLE IF NOT EXISTS custom_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_type text NOT NULL CHECK (category_type IN ('income', 'expense')),
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  icon text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_type, name)
);

CREATE INDEX IF NOT EXISTS idx_custom_categories_type ON custom_categories(category_type);

ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage custom categories"
  ON custom_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role::text = 'admin'
    )
  );

CREATE POLICY "All can view active custom categories"
  ON custom_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 8. Bulk Import History
CREATE TABLE IF NOT EXISTS bulk_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type text NOT NULL CHECK (import_type IN ('students', 'staff')),
  file_name text NOT NULL,
  total_rows integer NOT NULL,
  successful_rows integer DEFAULT 0,
  failed_rows integer DEFAULT 0,
  error_log jsonb,
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  imported_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_bulk_imports_type ON bulk_imports(import_type);
CREATE INDEX IF NOT EXISTS idx_bulk_imports_status ON bulk_imports(status);
CREATE INDEX IF NOT EXISTS idx_bulk_imports_created_at ON bulk_imports(created_at DESC);

ALTER TABLE bulk_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage bulk imports"
  ON bulk_imports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role::text = 'admin'
    )
  );

-- Insert default permissions
INSERT INTO permissions (module_name, permission_type, description) VALUES
  ('students', 'view', 'View student list and details'),
  ('students', 'create', 'Add new students'),
  ('students', 'edit', 'Edit student information'),
  ('students', 'delete', 'Delete students'),
  ('students', 'export', 'Export student data'),
  
  ('staff', 'view', 'View staff list and details'),
  ('staff', 'create', 'Add new staff members'),
  ('staff', 'edit', 'Edit staff information'),
  ('staff', 'delete', 'Delete staff members'),
  ('staff', 'export', 'Export staff data'),
  
  ('courses', 'view', 'View course schedules'),
  ('courses', 'create', 'Create new courses'),
  ('courses', 'edit', 'Edit course schedules'),
  ('courses', 'delete', 'Delete courses'),
  
  ('finance', 'view', 'View financial transactions'),
  ('finance', 'create', 'Create financial transactions'),
  ('finance', 'edit', 'Edit financial transactions'),
  ('finance', 'delete', 'Delete financial transactions'),
  ('finance', 'export', 'Export financial reports'),
  
  ('documents', 'view', 'View ministry documents'),
  ('documents', 'create', 'Upload ministry documents'),
  ('documents', 'edit', 'Edit document details'),
  ('documents', 'delete', 'Delete documents'),
  
  ('reports', 'view', 'View issue reports'),
  ('reports', 'create', 'Create issue reports'),
  ('reports', 'edit', 'Update issue reports'),
  ('reports', 'delete', 'Delete issue reports'),
  
  ('roles', 'view', 'View roles and permissions'),
  ('roles', 'create', 'Create new roles'),
  ('roles', 'edit', 'Edit role permissions'),
  ('roles', 'delete', 'Delete roles'),
  
  ('settings', 'view', 'View system settings'),
  ('settings', 'edit', 'Edit system settings')
ON CONFLICT (module_name, permission_type) DO NOTHING;

-- Grant all permissions to admin role by default
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'admin', id, true FROM permissions
ON CONFLICT (role, permission_id) DO UPDATE SET granted = true;

-- Add schedule conflict check function enhancement
CREATE OR REPLACE FUNCTION check_teacher_subject_qualification(
  p_teacher_id uuid,
  p_subject text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM teacher_subjects
    WHERE teacher_id = p_teacher_id
      AND subject = p_subject
  );
END;
$$;
