-- ============================================================
-- SPARK-A-THON 2026 — ATTENDANCE TABLE & MINIMAL SERVICE ROLE PERMISSIONS
-- Migration: 20260921_create_attendance.sql
-- Target Database: Supabase / PostgreSQL
-- ============================================================

-- 1. Create attendance table
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  participant_index integer not null, -- 0 = leader, 1..4 = members
  participant_name text not null,
  participant_roll_no text,
  status text not null default 'not_marked' check (status in ('present', 'absent', 'not_marked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (registration_id, participant_index)
);

-- 2. Indexes for fast retrieval
create index if not exists idx_attendance_reg_id 
  on public.attendance (registration_id);

create index if not exists idx_attendance_status 
  on public.attendance (status);

-- 3. Enable Row Level Security (RLS) on attendance
alter table public.attendance enable row level security;

-- 4. Minimum server-side permissions: service_role only (Organizer server-side)
-- Note: NO permissions granted to anon or authenticated.
grant select, insert, update, delete on public.attendance to service_role;

-- 5. Grant delete on registrations to service_role for server-side organizer delete API
grant delete on public.registrations to service_role;
