/*
  # Fix Remaining Auth UID RLS Policies

  1. Issue
    - Some policies still use improper auth.uid() syntax with double parentheses
    - Format should be (select auth.uid()) not (( SELECT auth.uid() AS uid))

  2. Solution  
    - Fix announcements, contact_submissions, gallery_images, testimonials policies

  3. Tables Updated
    - announcements (UPDATE, DELETE, INSERT policies)
    - contact_submissions (UPDATE, DELETE, SELECT policies)
    - gallery_images (UPDATE, DELETE, INSERT policies)
    - testimonials (UPDATE, DELETE, INSERT policies)
*/

-- ============================================
-- announcements table
-- ============================================

DROP POLICY IF EXISTS "Authenticated can manage announcements UPDATE" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated can manage announcements DELETE" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated can manage announcements INSERT" ON public.announcements;

CREATE POLICY "Authenticated can update announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can insert announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ============================================
-- contact_submissions table
-- ============================================

DROP POLICY IF EXISTS "Authenticated can manage submissions UPDATE" ON public.contact_submissions;
DROP POLICY IF EXISTS "Authenticated can manage submissions DELETE" ON public.contact_submissions;
DROP POLICY IF EXISTS "Authenticated can manage submissions SELECT" ON public.contact_submissions;

CREATE POLICY "Authenticated can view submissions"
  ON public.contact_submissions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can update submissions"
  ON public.contact_submissions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can delete submissions"
  ON public.contact_submissions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================
-- gallery_images table
-- ============================================

DROP POLICY IF EXISTS "Authenticated can manage gallery UPDATE" ON public.gallery_images;
DROP POLICY IF EXISTS "Authenticated can manage gallery DELETE" ON public.gallery_images;
DROP POLICY IF EXISTS "Authenticated can manage gallery INSERT" ON public.gallery_images;

CREATE POLICY "Authenticated can insert gallery"
  ON public.gallery_images FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can update gallery"
  ON public.gallery_images FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can delete gallery"
  ON public.gallery_images FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================
-- testimonials table
-- ============================================

DROP POLICY IF EXISTS "Authenticated can manage testimonials UPDATE" ON public.testimonials;
DROP POLICY IF EXISTS "Authenticated can manage testimonials DELETE" ON public.testimonials;
DROP POLICY IF EXISTS "Authenticated can manage testimonials INSERT" ON public.testimonials;

CREATE POLICY "Authenticated can insert testimonials"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can update testimonials"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can delete testimonials"
  ON public.testimonials FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);