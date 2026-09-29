-- ============================================================
-- SPARK-A-THON 2026 — JUDGING SYSTEM DATABASE SCHEMA
-- Migration: 20260929_create_judging_system.sql
-- Target Database: Supabase / PostgreSQL
-- ============================================================

-- 1. Create judges table
create table if not exists public.judges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  auth_user_id uuid references auth.users(id) on delete set null,
  domain text not null check (
    domain in (
      'AI and Cybersec',
      'Smart Energy Systems',
      'Robotics or Drone and Fixed Wing',
      'IoT or Embedded Systems',
      'Open Innovation'
    )
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for judges
create index if not exists idx_judges_email on public.judges (email);
create index if not exists idx_judges_domain on public.judges (domain);
create index if not exists idx_judges_auth_user_id on public.judges (auth_user_id);
create index if not exists idx_judges_is_active on public.judges (is_active);

-- 2. Create judge_team_assignments table
create table if not exists public.judge_team_assignments (
  id uuid primary key default gen_random_uuid(),
  judge_id uuid not null references public.judges(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (judge_id, registration_id)
);

-- Indexes for assignments
create index if not exists idx_assignments_judge_id on public.judge_team_assignments (judge_id);
create index if not exists idx_assignments_registration_id on public.judge_team_assignments (registration_id);

-- 3. Create judging_rubrics table
create table if not exists public.judging_rubrics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  max_score integer not null default 10 check (max_score > 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for rubrics
create index if not exists idx_rubrics_sort_order on public.judging_rubrics (sort_order asc);
create index if not exists idx_rubrics_is_active on public.judging_rubrics (is_active);

-- 4. Create judging_evaluations table
create table if not exists public.judging_evaluations (
  id uuid primary key default gen_random_uuid(),
  judge_id uuid not null references public.judges(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'submitted')),
  started_at timestamptz,
  submitted_at timestamptz,
  total_score numeric(6,2),
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (judge_id, registration_id)
);

-- Indexes for evaluations
create index if not exists idx_evaluations_judge_id on public.judging_evaluations (judge_id);
create index if not exists idx_evaluations_registration_id on public.judging_evaluations (registration_id);
create index if not exists idx_evaluations_status on public.judging_evaluations (status);

-- 5. Create judging_scores table
create table if not exists public.judging_scores (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.judging_evaluations(id) on delete cascade,
  rubric_id uuid not null references public.judging_rubrics(id) on delete cascade,
  score numeric(5,2) not null check (score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (evaluation_id, rubric_id)
);

-- Indexes for scores
create index if not exists idx_scores_evaluation_id on public.judging_scores (evaluation_id);
create index if not exists idx_scores_rubric_id on public.judging_scores (rubric_id);

-- 6. Seed initial official rubrics
insert into public.judging_rubrics (name, description, max_score, sort_order, is_active)
values
  ('Creativity & Innovation', 'Originality of the idea, novel approach to the problem, and unique value proposition.', 10, 1, true),
  ('Technical Feasibility', 'Soundness of technical architecture, implementation capability, and appropriate use of modern tools.', 10, 2, true),
  ('Scalability & Market Potential', 'Viability of real-world deployment, growth potential, target market sizing, and sustainability.', 10, 3, true),
  ('Presentation & Clarity', 'Effectiveness of team pitch, demo quality, communication of concepts, and Q&A responsiveness.', 10, 4, true),
  ('Problem-Solving Impact', 'Significance of the problem addressed, user benefit, measurable social or industry impact.', 10, 5, true)
on conflict do nothing;

-- 7. Enable Row Level Security (RLS) on all judging tables
alter table public.judges enable row level security;
alter table public.judge_team_assignments enable row level security;
alter table public.judging_rubrics enable row level security;
alter table public.judging_evaluations enable row level security;
alter table public.judging_scores enable row level security;

-- 8. Grant server-side service-role complete management
grant select, insert, update, delete on public.judges to service_role;
grant select, insert, update, delete on public.judge_team_assignments to service_role;
grant select, insert, update, delete on public.judging_rubrics to service_role;
grant select, insert, update, delete on public.judging_evaluations to service_role;
grant select, insert, update, delete on public.judging_scores to service_role;

-- 8b. Grant minimum table-level privileges for authenticated judges (future Judge Portal)
-- PostgreSQL RLS policies below enforce the actual row-level restrictions
grant select on public.registrations to authenticated;
grant select on public.judges to authenticated;
grant select on public.judge_team_assignments to authenticated;
grant select on public.judging_rubrics to authenticated;
grant select, insert, update on public.judging_evaluations to authenticated;
grant select, insert, update on public.judging_scores to authenticated;

-- 9. RLS Policies for authenticated judges (future Judge Portal)
-- A. Judges: Active judges can view ONLY their own profile
create policy "Active judges can view own profile"
  on public.judges
  for select
  to authenticated
  using (
    auth.uid() = auth_user_id
    and is_active = true
  );

-- B. Assignments: Active judges can view ONLY their own squad assignments
create policy "Active judges can view own team assignments"
  on public.judge_team_assignments
  for select
  to authenticated
  using (
    exists (
      select 1 from public.judges j
      where j.id = judge_team_assignments.judge_id
        and j.auth_user_id = auth.uid()
        and j.is_active = true
    )
  );

-- Rubrics: Active judges can view active evaluation rubrics
create policy "Active judges can view active rubrics"
  on public.judging_rubrics
  for select
  to authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.judges j
      where j.auth_user_id = auth.uid()
        and j.is_active = true
    )
  );

-- D. Evaluations: Active judges can INSERT evaluations ONLY for assigned teams
create policy "Active judges can insert own evaluations for assigned teams"
  on public.judging_evaluations
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.judges j
      join public.judge_team_assignments a on a.judge_id = j.id
      where j.id = judging_evaluations.judge_id
        and j.auth_user_id = auth.uid()
        and j.is_active = true
        and a.registration_id = judging_evaluations.registration_id
    )
  );

-- E. Evaluations: Active judges can SELECT their own evaluations ONLY for assigned teams
create policy "Active judges can view own evaluations for assigned teams"
  on public.judging_evaluations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.judges j
      join public.judge_team_assignments a on a.judge_id = j.id
      where j.id = judging_evaluations.judge_id
        and j.auth_user_id = auth.uid()
        and j.is_active = true
        and a.registration_id = judging_evaluations.registration_id
    )
  );

-- F. Evaluations: Active judges can UPDATE their own evaluations ONLY for assigned teams
create policy "Active judges can update own evaluations for assigned teams"
  on public.judging_evaluations
  for update
  to authenticated
  using (
    exists (
      select 1 from public.judges j
      join public.judge_team_assignments a on a.judge_id = j.id
      where j.id = judging_evaluations.judge_id
        and j.auth_user_id = auth.uid()
        and j.is_active = true
        and a.registration_id = judging_evaluations.registration_id
    )
  )
  with check (
    exists (
      select 1 from public.judges j
      join public.judge_team_assignments a on a.judge_id = j.id
      where j.id = judging_evaluations.judge_id
        and j.auth_user_id = auth.uid()
        and j.is_active = true
        and a.registration_id = judging_evaluations.registration_id
    )
  );

-- G. Scores: Active judges can view, insert, and update scores ONLY for assigned team evaluations
create policy "Active judges can view own scores for assigned teams"
  on public.judging_scores
  for select
  to authenticated
  using (
    exists (
      select 1 from public.judging_evaluations e
      join public.judges j on j.id = e.judge_id
      join public.judge_team_assignments a on a.judge_id = j.id and a.registration_id = e.registration_id
      where e.id = judging_scores.evaluation_id
        and j.auth_user_id = auth.uid()
        and j.is_active = true
    )
  );

create policy "Active judges can insert own scores for assigned teams"
  on public.judging_scores
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.judging_evaluations e
      join public.judges j on j.id = e.judge_id
      join public.judge_team_assignments a on a.judge_id = j.id and a.registration_id = e.registration_id
      where e.id = judging_scores.evaluation_id
        and j.auth_user_id = auth.uid()
        and j.is_active = true
    )
  );

create policy "Active judges can update own scores for assigned teams"
  on public.judging_scores
  for update
  to authenticated
  using (
    exists (
      select 1 from public.judging_evaluations e
      join public.judges j on j.id = e.judge_id
      join public.judge_team_assignments a on a.judge_id = j.id and a.registration_id = e.registration_id
      where e.id = judging_scores.evaluation_id
        and j.auth_user_id = auth.uid()
        and j.is_active = true
    )
  )
  with check (
    exists (
      select 1 from public.judging_evaluations e
      join public.judges j on j.id = e.judge_id
      join public.judge_team_assignments a on a.judge_id = j.id and a.registration_id = e.registration_id
      where e.id = judging_scores.evaluation_id
        and j.auth_user_id = auth.uid()
        and j.is_active = true
    )
  );

-- 10. Registration access: Active judges can SELECT only assigned squad dossiers
create policy "Active judges can view assigned registrations"
  on public.registrations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.judge_team_assignments a
      join public.judges j on j.id = a.judge_id
      where a.registration_id = registrations.id
        and j.auth_user_id = auth.uid()
        and j.is_active = true
    )
  );

