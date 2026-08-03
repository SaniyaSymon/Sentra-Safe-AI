-- ============================================================
-- SentraSafe AI — Supabase SQL Schema
-- Run this in Supabase Dashboard → SQL Editor
-- Target: Kerala & Tamil Nadu emergency response platform
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- USER PROFILES (linked to auth.users)
-- ============================================================
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('citizen','operator','campus')),
  full_name text not null,
  email text,
  phone text,
  state text not null,
  district text not null,
  preferred_language text not null default 'en',
  family_size int default 1,
  linked_campus_id uuid,
  campus_role text check (campus_role in ('professor','ncc','security','coordinator','admin','medical')),
  created_at timestamptz default now()
);
create index if not exists idx_user_profiles_auth on public.user_profiles(auth_user_id);
create index if not exists idx_user_profiles_state_district on public.user_profiles(state, district);

-- ============================================================
-- REFERENCE DATA
-- ============================================================
create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  name text not null,
  center_lat double precision,
  center_lng double precision,
  unique (state, name)
);

create table if not exists public.shelters (
  id uuid primary key default gen_random_uuid(),
  shelter_name text not null,
  state text not null,
  district text not null,
  max_capacity int not null default 0,
  occupied_spots int not null default 0,
  status text default 'active',
  latitude double precision not null,
  longitude double precision not null,
  contact_phone text,
  address text,
  created_at timestamptz default now()
);
create index if not exists idx_shelters_geo on public.shelters(state, district);

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  hospital_name text not null,
  state text not null,
  district text not null,
  hospital_type text,
  emergency_support boolean default true,
  bed_capacity int not null default 0,
  available_beds int not null default 0,
  status text default 'operational',
  latitude double precision not null,
  longitude double precision not null,
  contact_phone text,
  address text,
  created_at timestamptz default now()
);
create index if not exists idx_hospitals_geo on public.hospitals(state, district);

create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  college_name text not null,
  state text not null,
  district text not null,
  college_type text,
  can_be_relief_center boolean default true,
  current_status text default 'operational',
  latitude double precision not null,
  longitude double precision not null,
  contact_phone text,
  address text,
  emergency_number text,
  admin_contact text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_colleges_geo on public.colleges(state, district);

create table if not exists public.hazard_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  district text not null,
  hazard_type text not null,
  risk_level text not null,
  latitude double precision not null,
  longitude double precision not null,
  rules_json jsonb default '{}'::jsonb
);
create index if not exists idx_hazard_geo on public.hazard_zones(state, district);

create table if not exists public.campus_contacts (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  contact_name text not null,
  role_type text not null check (role_type in ('professor','ncc','security','coordinator','admin','medical')),
  phone text not null,
  preferred_language text default 'en',
  can_receive_sms boolean default true,
  can_receive_voice_call boolean default true,
  is_primary boolean default false,
  is_active boolean default true,
  updated_at timestamptz default now()
);
create index if not exists idx_campus_contacts_college on public.campus_contacts(college_id);

-- ============================================================
-- OPERATIONAL DATA
-- ============================================================
create table if not exists public.sos_queue (
  id uuid primary key default gen_random_uuid(),
  incident_code text unique not null,
  citizen_user_id uuid references auth.users(id) on delete set null,
  citizen_name text not null,
  phone text not null,
  latitude double precision not null,
  longitude double precision not null,
  hazard_type text not null,
  details text,
  status text not null default 'new' check (status in ('new','acknowledged','dispatched','resolved')),
  state text not null,
  district text not null,
  preferred_language text default 'en',
  linked_college_id uuid references public.colleges(id) on delete set null,
  operator_status text default 'pending',
  campus_status text default 'pending',
  sync_state text default 'synced',
  trapped_count int default 1,
  medical_notes text,
  assigned_operator text,
  assigned_team text,
  eta_minutes int,
  notes text,
  ai_severity int,
  ai_hazard_type text,
  ai_description text,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_sos_status on public.sos_queue(status);
create index if not exists idx_sos_geo on public.sos_queue(state, district);
create index if not exists idx_sos_college on public.sos_queue(linked_college_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  target_role text not null,
  target_entity_id uuid,
  related_sos_id uuid references public.sos_queue(id) on delete cascade,
  message_title text not null,
  message_body text,
  notification_type text default 'info',
  delivery_channel text default 'in_app',
  delivery_status text default 'pending',
  created_at timestamptz default now()
);
create index if not exists idx_notif_target on public.notifications(target_role, target_entity_id);

create table if not exists public.emergency_dispatch (
  id uuid primary key default gen_random_uuid(),
  sos_id uuid references public.sos_queue(id) on delete cascade,
  assigned_operator text,
  assigned_team_name text,
  dispatch_status text default 'pending',
  eta_minutes int,
  notes text,
  updated_at timestamptz default now()
);

create table if not exists public.damage_assessments (
  id uuid primary key default gen_random_uuid(),
  sos_id uuid references public.sos_queue(id) on delete cascade,
  state text, district text,
  severity_score int,
  severity_level text,
  hazard_type text,
  damage_description text,
  guidance_en text, guidance_ta text, guidance_ml text,
  photo_url text,
  created_at timestamptz default now()
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  testing_sms_number text,
  testing_call_number text,
  sms_enabled boolean default true,
  voice_call_enabled boolean default true
);

-- ============================================================
-- REALTIME (enable for these tables in Supabase Dashboard →
-- Database → Replication → supabase_realtime publication)
-- ============================================================
-- alter publication supabase_realtime add table public.sos_queue;
-- alter publication supabase_realtime add table public.notifications;
-- alter publication supabase_realtime add table public.campus_contacts;

-- ============================================================
-- STORAGE (create bucket via Dashboard)
-- Bucket name: "damage-photos" (public read, auth write)
-- ============================================================

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.user_profiles      enable row level security;
alter table public.shelters           enable row level security;
alter table public.hospitals          enable row level security;
alter table public.colleges           enable row level security;
alter table public.hazard_zones       enable row level security;
alter table public.campus_contacts    enable row level security;
alter table public.sos_queue          enable row level security;
alter table public.notifications      enable row level security;
alter table public.emergency_dispatch enable row level security;
alter table public.damage_assessments enable row level security;
alter table public.districts          enable row level security;
alter table public.app_settings       enable row level security;

-- Public reference data — anyone can read
create policy if not exists "public read shelters"    on public.shelters      for select using (true);
create policy if not exists "public read hospitals"   on public.hospitals     for select using (true);
create policy if not exists "public read colleges"    on public.colleges      for select using (true);
create policy if not exists "public read hazards"     on public.hazard_zones  for select using (true);
create policy if not exists "public read districts"   on public.districts     for select using (true);
create policy if not exists "public read campus_contacts" on public.campus_contacts for select using (is_active = true);

-- SOS: anyone (incl. anonymous) can INSERT their own alert; SELECT open for demo
create policy if not exists "anyone insert sos"       on public.sos_queue for insert with check (true);
create policy if not exists "public read sos"         on public.sos_queue for select using (true);
create policy if not exists "authed update sos"      on public.sos_queue for update using (auth.role() = 'authenticated');

-- Notifications: read all, insert authenticated
create policy if not exists "public read notif"       on public.notifications for select using (true);
create policy if not exists "authed insert notif"     on public.notifications for insert with check (true);

-- Campus contacts CRUD: only users whose profile has campus_role in (coordinator, admin)
create policy if not exists "campus admin write contacts" on public.campus_contacts
  for insert with check (
    exists (select 1 from public.user_profiles p
      where p.auth_user_id = auth.uid()
        and p.role = 'campus'
        and p.campus_role in ('coordinator','admin')
        and p.linked_campus_id::text = college_id::text)
  );
create policy if not exists "campus admin update contacts" on public.campus_contacts
  for update using (
    exists (select 1 from public.user_profiles p
      where p.auth_user_id = auth.uid()
        and p.campus_role in ('coordinator','admin')
        and p.linked_campus_id::text = college_id::text)
  );
create policy if not exists "campus admin delete contacts" on public.campus_contacts
  for delete using (
    exists (select 1 from public.user_profiles p
      where p.auth_user_id = auth.uid()
        and p.campus_role in ('coordinator','admin')
        and p.linked_campus_id::text = college_id::text)
  );

-- User profiles: self read/write
create policy if not exists "self read profile"       on public.user_profiles for select using (auth.uid() = auth_user_id);
create policy if not exists "self insert profile"     on public.user_profiles for insert with check (auth.uid() = auth_user_id);
create policy if not exists "self update profile"     on public.user_profiles for update using (auth.uid() = auth_user_id);

-- Damage assessments: public read, authenticated insert
create policy if not exists "public read damage"      on public.damage_assessments for select using (true);
create policy if not exists "authed insert damage"    on public.damage_assessments for insert with check (true);

-- Owner (super admin) — symonsaniya@gmail.com — full access via JWT email claim
create policy if not exists "owner full user_profiles" on public.user_profiles
  for all using (auth.jwt() ->> 'email' = 'symonsaniya@gmail.com') with check (true);
create policy if not exists "owner full campus_contacts" on public.campus_contacts
  for all using (auth.jwt() ->> 'email' = 'symonsaniya@gmail.com') with check (true);
create policy if not exists "owner full sos_queue" on public.sos_queue
  for all using (auth.jwt() ->> 'email' = 'symonsaniya@gmail.com') with check (true);
