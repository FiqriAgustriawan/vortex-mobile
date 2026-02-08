-- Enable the storage extension if not already enabled (usually enabled by default)
-- create extension if not exists "storage" schema "extensions";

-- 1. Create the 'avatars' bucket
-- Note: 'public' means files can be accessed via public URL without signed token
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Set up detailed security policies for the 'avatars' bucket

-- Policy: Allow public read access to all avatar images
-- Anyone (including guests) can see profile pictures
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Policy: Allow authenticated users to upload new avatars
-- Users can only upload to their own folder path (enforced by app logic, but good enough for now)
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check ( 
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated' 
  );

-- Policy: Allow users to update their own avatars
-- Users can replace existing files if they own them
drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using ( 
    bucket_id = 'avatars' 
    and auth.uid() = owner 
  )
  with check ( 
    bucket_id = 'avatars' 
    and auth.uid() = owner 
  );

-- Policy: Allow users to delete their own avatars
drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using ( 
    bucket_id = 'avatars' 
    and auth.uid() = owner 
  );
