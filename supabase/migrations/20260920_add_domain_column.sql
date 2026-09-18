-- ============================================================
-- SPARK-A-THON 2026 — ADD DOMAIN SECTOR COLUMN
-- Migration: 20260920_add_domain_column.sql
-- Target Database: Supabase / PostgreSQL
-- ============================================================

-- 1. Safely add domain column
alter table if exists public.registrations
  add column if not exists domain text;

-- 2. Index for domain filtering
create index if not exists idx_registrations_domain
  on public.registrations (domain);

-- 3. Update registrations_overview view to include domain
create or replace view public.registrations_overview as
select
  id,
  team_name,
  college,
  domain,
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

-- 4. Maintain service_role permissions
grant select, insert, update on public.registrations to service_role;
grant select on public.registrations_overview to service_role;
