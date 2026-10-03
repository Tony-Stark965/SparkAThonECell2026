-- ============================================================
-- SPARK-A-THON 2026 — PERMANENT SUBMISSION LOCK & INTEGRITY
-- Migration: 20261003_enforce_permanent_lock_and_integrity.sql
-- Target Database: Supabase / PostgreSQL
-- ============================================================

-- 1. Ensure any obsolete correction requests table is cleaned up if it existed
drop table if exists public.judging_correction_requests cascade;

-- 2. Trigger Function to Enforce Permanent Lock on judging_evaluations
create or replace function public.enforce_evaluation_submitted_lock()
returns trigger as $$
begin
  -- Prevent modifications or deletion if evaluation has already been submitted
  if old.status = 'submitted' then
    raise exception 'Permanent Lock Violation: Submitted evaluation (ID: %) is permanently locked and cannot be modified or deleted.', old.id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_lock_submitted_evaluations on public.judging_evaluations;

create trigger trg_lock_submitted_evaluations
before update or delete on public.judging_evaluations
for each row execute function public.enforce_evaluation_submitted_lock();

-- 3. Trigger Function to Enforce Permanent Lock on judging_scores
create or replace function public.enforce_scores_submitted_lock()
returns trigger as $$
declare
  v_status text;
begin
  select status into v_status
  from public.judging_evaluations
  where id = coalesce(new.evaluation_id, old.evaluation_id);

  if v_status = 'submitted' then
    raise exception 'Permanent Lock Violation: Scores for submitted evaluation (ID: %) cannot be inserted, modified, or deleted.', coalesce(new.evaluation_id, old.evaluation_id);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_lock_submitted_scores on public.judging_scores;

create trigger trg_lock_submitted_scores
before insert or update or delete on public.judging_scores
for each row execute function public.enforce_scores_submitted_lock();

-- 4. Harden RLS Policies for update on judging_evaluations to block submitted records
drop policy if exists "Active judges can update own evaluations for assigned teams" on public.judging_evaluations;

create policy "Active judges can update own evaluations for assigned teams"
  on public.judging_evaluations
  for update
  to authenticated
  using (
    status != 'submitted'
    and exists (
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

-- 5. Harden RLS Policies for update on judging_scores to block submitted records
drop policy if exists "Active judges can update own scores for assigned teams" on public.judging_scores;

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
        and e.status != 'submitted'
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
        and e.status != 'submitted'
        and j.auth_user_id = auth.uid()
        and j.is_active = true
    )
  );
