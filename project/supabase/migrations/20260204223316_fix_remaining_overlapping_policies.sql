/*
  # Fix Remaining Overlapping Policies

  1. Issue
    - announcements table has 2 SELECT policies (anon + authenticated)
    - profiles table has 2 SELECT policies (own profile + admin all)

  2. Solution
    - Consolidate announcements policies into one that handles both anon and authenticated
    - Consolidate profiles policies into one that handles both cases

  3. Changes
    - Fix announcements SELECT policies
    - Fix profiles SELECT policies
*/

-- ============================================
-- announcements table
-- ============================================

DROP POLICY IF EXISTS "Anon can view active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated can manage announcements SELECT" ON public.announcements;

CREATE POLICY "Users can view announcements"
  ON public.announcements FOR SELECT
  TO authenticated, anon
  USING (
    CASE 
      WHEN (select auth.uid()) IS NULL THEN is_active = true
      ELSE true
    END
  );

-- ============================================
-- profiles table
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.profiles profiles_1
      WHERE profiles_1.id = (select auth.uid()) 
      AND profiles_1.role = 'admin'::user_role_type
    )
  );