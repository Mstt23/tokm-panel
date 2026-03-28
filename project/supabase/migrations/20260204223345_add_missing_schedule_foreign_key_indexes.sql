/*
  # Add Missing Foreign Key Indexes for Schedules

  1. Issue
    - schedules.student_id foreign key has no index
    - schedules.teacher_id foreign key has no index

  2. Solution
    - Add indexes for these foreign key columns

  3. Performance Impact
    - Improves JOIN performance when querying schedules by student or teacher
    - Speeds up foreign key constraint checks
*/

CREATE INDEX IF NOT EXISTS idx_schedules_student_id 
  ON public.schedules(student_id);

CREATE INDEX IF NOT EXISTS idx_schedules_teacher_id 
  ON public.schedules(teacher_id);