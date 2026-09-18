-- ============================================================
-- SPARK-A-THON 2026 — ADD LEADER EMAIL AND SERVICE ROLE GRANTS
-- Migration: 20260919_add_email_and_service_role_grants.sql
-- Target Database: Supabase / PostgreSQL
-- ============================================================

-- 1. Safely add team_leader_email column
alter table if exists public.registrations
  add column if not exists team_leader_email text;

-- 2. Index for email lookup
create index if not exists idx_registrations_team_leader_email
  on public.registrations (team_leader_email);

-- 3. Update registrations_overview view
create or replace view public.registrations_overview as
select
  id,
  team_name,
  college,
  participant_count,
  team_leader_name,
  team_leader_roll_no,
  team_leader_mobile,
  team_leader_email,
  participants,
  registration_fee,
  payment_status,
  payment_reference,
  created_at,
  updated_at
from public.registrations;

-- 4. Organizer Command Center Permissions
-- Grants service_role table permissions for organizer payment status updates
-- (DO NOT grant update to anon or authenticated users)
grant select, insert, update on public.registrations to service_role;
grant select on public.registrations_overview to service_role;
