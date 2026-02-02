-- Create memberships table to track AMR member subscriptions
-- Status flow: pending (applied) -> active (approved) -> expired

-- Create enum type for membership status
create type public.membership_status as enum ('pending', 'active', 'expired');

create table if not exists public.memberships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status public.membership_status not null default 'pending',
  applied_at timestamptz default now() not null,
  approved_at timestamptz,
  expires_at timestamptz,
  payment_reference text
);

-- Create index on user_id for efficient lookups
create index memberships_user_id_idx on public.memberships (user_id);

-- Create index on status for filtering
create index memberships_status_idx on public.memberships (status);

-- Enable Row Level Security
alter table public.memberships enable row level security;

-- RLS policy: users can read their own membership
create policy "Users can view own membership"
  on public.memberships for select
  using (auth.uid() = user_id);

-- RLS policy: admin read all (service_role bypasses RLS)
-- Placeholder policy for when admin role system is implemented
create policy "Admin can view all memberships"
  on public.memberships for select
  using (false);

-- RLS policy: users can apply for membership (insert)
create policy "Users can apply for membership"
  on public.memberships for insert
  with check (auth.uid() = user_id);

-- RLS policy: admin write operations
-- Note: service_role bypasses RLS entirely, so these policies apply to authenticated users only
-- When an admin role system is implemented, update these policies to check admin status
create policy "Admin can update memberships"
  on public.memberships for update
  using (false);

create policy "Admin can delete memberships"
  on public.memberships for delete
  using (false);
