-- Create shadow_players table to track non-registered players in tournaments and rankings
create table if not exists public.shadow_players (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now() not null,
  linked_user_id uuid references public.profiles(id) on delete set null
);

-- Create unique constraint on name (case-insensitive)
create unique index shadow_players_name_unique_idx on public.shadow_players (lower(name));

-- Create index on linked_user_id for efficient lookups
create index shadow_players_linked_user_id_idx on public.shadow_players (linked_user_id);

-- Enable Row Level Security
alter table public.shadow_players enable row level security;

-- RLS policy: public read access
create policy "Anyone can read shadow players"
  on public.shadow_players for select
  using (true);

-- RLS policy: admin write operations
-- Note: service_role bypasses RLS entirely, so these policies apply to authenticated users only
-- For now, no authenticated users can write - all write operations go through service_role (server-side)
-- When an admin role system is implemented, update these policies to check admin status
create policy "Admin can insert shadow players"
  on public.shadow_players for insert
  with check (false);

create policy "Admin can update shadow players"
  on public.shadow_players for update
  using (false);

create policy "Admin can delete shadow players"
  on public.shadow_players for delete
  using (false);
