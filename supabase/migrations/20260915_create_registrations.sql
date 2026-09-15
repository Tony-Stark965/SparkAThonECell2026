-- ============================================================
-- SPARK-A-THON 2026 — REGISTRATIONS DATABASE SCHEMA
-- Target Database: Supabase / PostgreSQL
-- ============================================================

-- 1. Create registrations table
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  college text not null,
  participant_count integer not null check (participant_count >= 2 and participant_count <= 5),
  team_leader_name text not null,
  team_leader_mobile text not null,
  participants jsonb not null default '[]'::jsonb,
  registration_fee integer not null,
  payment_status text not null default 'pending',
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Indexes for efficient lookup and telemetry
create index if not exists idx_registrations_team_leader_mobile on public.registrations (team_leader_mobile);
create index if not exists idx_registrations_created_at on public.registrations (created_at desc);
create index if not exists idx_registrations_payment_status on public.registrations (payment_status);

-- 3. Enable Row Level Security (RLS)
alter table public.registrations enable row level security;

-- 4. RLS Policy: Allow public anonymous insertion for registration form
create policy "Allow public team registrations"
  on public.registrations
  for insert
  to anon, authenticated
  with check (true);

-- 5. RLS Policy: Allow service role complete management
create policy "Allow service role full access"
  on public.registrations
  for all
  to service_role
  using (true)
  with check (true);

-- 6. Optional view for sanitized organizer export (without sensitive internals)
create or replace view public.registrations_overview as
select
  id,
  team_name,
  college,
  participant_count,
  team_leader_name,
  team_leader_mobile,
  participants,
  registration_fee,
  payment_status,
  payment_reference,
  created_at
from public.registrations;
