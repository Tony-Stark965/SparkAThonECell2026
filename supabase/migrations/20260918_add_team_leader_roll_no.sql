-- ============================================================
-- SPARK-A-THON 2026 — ADD TEAM LEADER ROLL NUMBER
-- Migration: 20260918_add_team_leader_roll_no.sql
-- Safely applies to an already-existing Supabase database
-- ============================================================

-- 1. Safely add team_leader_roll_no column if it does not exist
alter table if exists public.registrations
  add column if not exists team_leader_roll_no text;

-- 2. Optional index for roll number lookups
create index if not exists idx_registrations_team_leader_roll_no
  on public.registrations (team_leader_roll_no);

-- 3. Update view to include team_leader_roll_no
create or replace view public.registrations_overview as
select
  id,
  team_name,
  college,
  participant_count,
  team_leader_name,
  team_leader_roll_no,
  team_leader_mobile,
  participants,
  registration_fee,
  payment_status,
  payment_reference,
  created_at
from public.registrations;
