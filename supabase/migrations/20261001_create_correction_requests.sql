-- ============================================================
-- SPARK-A-THON 2026 — JUDGING CORRECTION REQUESTS SCHEMA
-- Migration: 20261001_create_correction_requests.sql
-- Target Database: Supabase / PostgreSQL
-- ============================================================

-- 1. Create judging_correction_requests table
create table if not exists public.judging_correction_requests (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.judging_evaluations(id) on delete cascade,
  judge_id uuid not null references public.judges(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  reason text not null,
  explanation text not null,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'completed')
  ),
  original_total_score numeric(6,2),
  original_scores_snapshot jsonb,
  revised_total_score numeric(6,2),
  revised_scores_snapshot jsonb,
  admin_notes text,
  reviewed_by text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance & query filtering
create index if not exists idx_correction_requests_judge_id on public.judging_correction_requests (judge_id);
create index if not exists idx_correction_requests_eval_id on public.judging_correction_requests (evaluation_id);
create index if not exists idx_correction_requests_reg_id on public.judging_correction_requests (registration_id);
create index if not exists idx_correction_requests_status on public.judging_correction_requests (status);
create index if not exists idx_correction_requests_created_at on public.judging_correction_requests (created_at desc);

-- 2. Enable Row Level Security (RLS)
alter table public.judging_correction_requests enable row level security;

-- Drop any conflicting existing policies
drop policy if exists "Service role full access on judging_correction_requests" on public.judging_correction_requests;
drop policy if exists "Judges can view own correction requests" on public.judging_correction_requests;
drop policy if exists "Judges can insert own correction requests" on public.judging_correction_requests;

-- Policy 1: Service role has complete administrative authority
create policy "Service role full access on judging_correction_requests"
  on public.judging_correction_requests
  for all
  to service_role
  using (true)
  with check (true);

-- Policy 2: Judges can view their own correction requests
create policy "Judges can view own correction requests"
  on public.judging_correction_requests
  for select
  to authenticated
  using (
    auth.uid() is not null
    and auth.uid() = (
      select auth_user_id
      from public.judges
      where id = judging_correction_requests.judge_id
    )
  );

-- Policy 3: Judges can submit correction requests for their own evaluations
create policy "Judges can insert own correction requests"
  on public.judging_correction_requests
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and auth.uid() = (
      select auth_user_id
      from public.judges
      where id = judging_correction_requests.judge_id
    )
  );

-- Grant privileges to service_role and authenticated users
grant all on public.judging_correction_requests to service_role;
grant select, insert on public.judging_correction_requests to authenticated;
