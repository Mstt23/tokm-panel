/*
  # Fix Profiles SELECT Policy Circular Dependency

  1. Problem
    - Current SELECT policy on profiles table queries the profiles table itself
    - This creates a circular dependency that prevents profile loading on first login
    - User cannot login because profile cannot be loaded
    
  2. Solution
    - Simplify SELECT policy to only check if user is authenticated
    - Remove circular dependency by not querying profiles within profiles policy
    - Each authenticated user can view their own profile

  3. Changes
    - Drop existing "Users can view profiles" policy
    - Create new simplified policy that allows users to view their own profile
*/

DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));