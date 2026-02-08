-- =============================================
-- VORTEX AI CHAT - SUPABASE DATABASE SCHEMA
-- =============================================
-- FIXED VERSION V2: Policies avoid infinite recursion
-- Copy-paste this ENTIRE script into Supabase SQL Editor
-- IMPORTANT: Run this script AFTER deleting all existing tables!

-- =============================================
-- PART 0: DROP EXISTING POLICIES (If any)
-- =============================================
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can view their rooms" on public.rooms;
drop policy if exists "Authenticated users can create rooms" on public.rooms;
drop policy if exists "Users can view room members" on public.room_members;
drop policy if exists "Users can add members" on public.room_members;
drop policy if exists "Users can view messages in their rooms" on public.messages;
drop policy if exists "Users can send messages in their rooms" on public.messages;

-- =============================================
-- PART 1: CREATE ALL TABLES FIRST
-- =============================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- 2. ROOMS TABLE
create table if not exists public.rooms (
  id uuid default gen_random_uuid() primary key,
  name text,
  is_group boolean default false,
  invite_token text unique default encode(gen_random_bytes(4), 'hex'),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 3. ROOM_MEMBERS TABLE
create table if not exists public.room_members (
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

-- 4. MESSAGES TABLE
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);


-- =============================================
-- PART 2: CREATE HELPER FUNCTION (SECURITY DEFINER)
-- =============================================
-- This function bypasses RLS to check if user is member of a room

create or replace function public.is_room_member(room_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.room_members
    where room_id = room_uuid and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;


-- =============================================
-- PART 3: ENABLE RLS ON ALL TABLES
-- =============================================

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;


-- =============================================
-- PART 4: CREATE POLICIES (Using helper function)
-- =============================================

-- PROFILES POLICIES (Simple - no recursion issue)
create policy "Public profiles viewable"
  on public.profiles for select
  using (true);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ROOMS POLICIES (Use helper function)
create policy "Members can view rooms"
  on public.rooms for select
  using (public.is_room_member(id) OR created_by = auth.uid());

create policy "Auth users can create rooms"
  on public.rooms for insert
  with check (auth.uid() is not null);

-- ROOM_MEMBERS POLICIES (Simple - direct user check)
create policy "Members can view room members"
  on public.room_members for select
  using (user_id = auth.uid() OR public.is_room_member(room_id));

create policy "Auth users can join rooms"
  on public.room_members for insert
  with check (auth.uid() is not null);

-- MESSAGES POLICIES (Use helper function)
create policy "Members can view messages"
  on public.messages for select
  using (public.is_room_member(room_id));

create policy "Members can send messages"
  on public.messages for insert
  with check (public.is_room_member(room_id));


-- =============================================
-- PART 5: AUTO-CREATE PROFILE TRIGGER
-- =============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =============================================
-- PART 6: ENABLE REALTIME & INDEXES
-- =============================================

-- Add tables to realtime (ignore error if already added)
do $$
begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then
  null;
end$$;

create index if not exists idx_messages_room_id on public.messages(room_id);
create index if not exists idx_messages_created_at on public.messages(created_at);
create index if not exists idx_room_members_user_id on public.room_members(user_id);
create index if not exists idx_room_members_room_id on public.room_members(room_id);
create index if not exists idx_rooms_invite_token on public.rooms(invite_token);


-- =============================================
-- PART 7: JOIN ROOM BY TOKEN FUNCTION
-- =============================================

-- Function to join a room using invite token
create or replace function public.join_room_by_token(token text)
returns json as $$
declare
  target_room public.rooms%rowtype;
  result json;
begin
  -- Find room by token
  select * into target_room from public.rooms where invite_token = token;
  
  if target_room.id is null then
    return json_build_object('success', false, 'error', 'Token tidak valid');
  end if;
  
  -- Check if already a member
  if exists (select 1 from public.room_members where room_id = target_room.id and user_id = auth.uid()) then
    return json_build_object('success', false, 'error', 'Kamu sudah bergabung di room ini');
  end if;
  
  -- Add user to room
  insert into public.room_members (room_id, user_id, role)
  values (target_room.id, auth.uid(), 'member');
  
  return json_build_object(
    'success', true, 
    'room_id', target_room.id, 
    'room_name', target_room.name
  );
end;
$$ language plpgsql security definer;


-- =============================================
-- DONE! Run this script in Supabase SQL Editor
-- =============================================

