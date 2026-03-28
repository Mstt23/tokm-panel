-- Ders programı kalıcı veri (ScheduleTable / scheduleProgramsService.ts)
-- Uygulama bu tabloyu bekler; yoksa "schema cache" hatası alırsınız.

create table if not exists public.ders_programi_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_name text not null default 'Ana program',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ders_programi_programs_user_id_idx
  on public.ders_programi_programs (user_id);

create index if not exists ders_programi_programs_user_updated_idx
  on public.ders_programi_programs (user_id, updated_at desc);

create or replace function public.ders_programi_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ders_programi_programs_set_updated_at on public.ders_programi_programs;

create trigger ders_programi_programs_set_updated_at
  before update on public.ders_programi_programs
  for each row
  execute function public.ders_programi_set_updated_at();

alter table public.ders_programi_programs enable row level security;

drop policy if exists "ders_programi_select_own" on public.ders_programi_programs;
drop policy if exists "ders_programi_insert_own" on public.ders_programi_programs;
drop policy if exists "ders_programi_update_own" on public.ders_programi_programs;
drop policy if exists "ders_programi_delete_own" on public.ders_programi_programs;

create policy "ders_programi_select_own"
  on public.ders_programi_programs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "ders_programi_insert_own"
  on public.ders_programi_programs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "ders_programi_update_own"
  on public.ders_programi_programs for update
  to authenticated
  using (auth.uid() = user_id);

create policy "ders_programi_delete_own"
  on public.ders_programi_programs for delete
  to authenticated
  using (auth.uid() = user_id);
