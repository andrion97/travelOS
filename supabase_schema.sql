-- ============================================
-- TripSync MVP — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================
-- TRIPS
-- ============================================
create table if not exists trips (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  approximate_month text,
  note text,
  organizer_id uuid references auth.users(id) on delete cascade,
  invite_code text unique not null default substring(md5(random()::text), 1, 8),
  phase text default 'onboarding' check (phase in ('onboarding','destination','dates_budget','itinerary','on_trip','completed')),
  destination text,
  date_start date,
  date_end date,
  budget_min numeric,
  budget_max numeric,
  vote_deadline timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- ============================================
-- TRIP MEMBERS
-- ============================================
create table if not exists trip_members (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  role text default 'member' check (role in ('organizer','member')),
  session_token text unique default gen_random_uuid()::text,
  joined_at timestamp with time zone default now()
);

-- ============================================
-- PREFERENCES (one per member per trip, budget is private)
-- ============================================
create table if not exists preferences (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  member_id uuid references trip_members(id) on delete cascade not null,
  vibe text check (vibe in ('adventure','chill','cultural','mix')),
  budget_min numeric,
  budget_max numeric,
  dietary text check (dietary in ('veg','non-veg','vegan','no-preference')),
  must_have text,
  dealbreaker text,
  created_at timestamp with time zone default now(),
  unique(trip_id, member_id)
);

-- ============================================
-- DESTINATION OPTIONS
-- ============================================
create table if not exists destination_options (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  name text not null,
  note text,
  added_by uuid references trip_members(id) on delete set null,
  vote_count integer default 0,
  created_at timestamp with time zone default now()
);

-- ============================================
-- VOTES
-- ============================================
create table if not exists votes (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  destination_id uuid references destination_options(id) on delete cascade not null,
  member_id uuid references trip_members(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(trip_id, member_id)
);

-- ============================================
-- DATE AVAILABILITY
-- ============================================
create table if not exists date_availability (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  member_id uuid references trip_members(id) on delete cascade not null,
  available_dates text[] not null default '{}',
  created_at timestamp with time zone default now(),
  unique(trip_id, member_id)
);

-- ============================================
-- ITINERARY
-- ============================================
create table if not exists itinerary (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  day_number integer not null,
  date date,
  title text,
  items jsonb not null default '[]',
  created_at timestamp with time zone default now(),
  unique(trip_id, day_number)
);

-- ============================================
-- TASKS
-- ============================================
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  title text not null,
  assigned_to uuid references trip_members(id) on delete set null,
  deadline date,
  notes text,
  status text default 'todo' check (status in ('todo','in_progress','done')),
  created_at timestamp with time zone default now()
);

-- ============================================
-- EXPENSES
-- ============================================
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  paid_by uuid references trip_members(id) on delete cascade not null,
  description text not null,
  amount numeric not null,
  split_among uuid[] not null,
  raw_input text,
  created_at timestamp with time zone default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table trips enable row level security;
alter table trip_members enable row level security;
alter table preferences enable row level security;
alter table destination_options enable row level security;
alter table votes enable row level security;
alter table date_availability enable row level security;
alter table itinerary enable row level security;
alter table tasks enable row level security;
alter table expenses enable row level security;

-- Allow all authenticated users to read trips they are members of
-- For MVP simplicity, use permissive policies

create policy "Allow all operations for authenticated users on trips"
  on trips for all using (true) with check (true);

create policy "Allow all operations on trip_members"
  on trip_members for all using (true) with check (true);

create policy "Allow all operations on preferences"
  on preferences for all using (true) with check (true);

create policy "Allow all operations on destination_options"
  on destination_options for all using (true) with check (true);

create policy "Allow all operations on votes"
  on votes for all using (true) with check (true);

create policy "Allow all operations on date_availability"
  on date_availability for all using (true) with check (true);

create policy "Allow all operations on itinerary"
  on itinerary for all using (true) with check (true);

create policy "Allow all operations on tasks"
  on tasks for all using (true) with check (true);

create policy "Allow all operations on expenses"
  on expenses for all using (true) with check (true);

-- ============================================
-- REALTIME
-- Enable realtime for live updates
-- ============================================
-- Run these in the Supabase dashboard > Database > Replication
-- or via: alter publication supabase_realtime add table trips, trip_members, votes, itinerary, expenses, tasks;
