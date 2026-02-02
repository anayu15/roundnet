-- Create tournament tables for managing roundnet tournaments
-- Tables: tournaments, tournament_teams, tournament_team_members, tournament_results

-- Create enum types for tournament fields
create type public.tournament_category as enum ('mens', 'womens', 'mixed');
create type public.tournament_status as enum ('draft', 'open', 'closed', 'completed');
create type public.team_payment_status as enum ('pending', 'paid', 'refunded');
create type public.team_member_role as enum ('player1', 'player2');

-- ============================================================================
-- tournaments table
-- ============================================================================
create table if not exists public.tournaments (
  id uuid default gen_random_uuid() primary key,
  name_es text not null,
  name_en text not null,
  description_es text,
  description_en text,
  date date not null,
  location text not null,
  registration_deadline timestamptz not null,
  max_teams integer not null check (max_teams > 0),
  category public.tournament_category not null,
  status public.tournament_status not null default 'draft',
  points_config jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create indexes for tournaments
create index tournaments_date_idx on public.tournaments (date);
create index tournaments_status_idx on public.tournaments (status);
create index tournaments_category_idx on public.tournaments (category);

-- Create trigger for updated_at
create trigger tournaments_updated_at
  before update on public.tournaments
  for each row
  execute function public.update_updated_at_column();

-- Enable Row Level Security
alter table public.tournaments enable row level security;

-- RLS policy: anyone can read non-draft tournaments
create policy "Anyone can read published tournaments"
  on public.tournaments for select
  using (status != 'draft');

-- RLS policy: admin read all (including draft)
-- Placeholder: service_role bypasses RLS for server-side operations
create policy "Admin can read all tournaments"
  on public.tournaments for select
  using (false);

-- RLS policy: admin write operations
create policy "Admin can insert tournaments"
  on public.tournaments for insert
  with check (false);

create policy "Admin can update tournaments"
  on public.tournaments for update
  using (false);

create policy "Admin can delete tournaments"
  on public.tournaments for delete
  using (false);

-- ============================================================================
-- tournament_teams table
-- ============================================================================
create table if not exists public.tournament_teams (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  team_name text not null,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  registration_date timestamptz default now() not null,
  payment_status public.team_payment_status not null default 'pending',
  payment_reference text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- Ensure unique team names within a tournament
  unique (tournament_id, team_name)
);

-- Create indexes for tournament_teams
create index tournament_teams_tournament_id_idx on public.tournament_teams (tournament_id);
create index tournament_teams_created_by_user_id_idx on public.tournament_teams (created_by_user_id);
create index tournament_teams_payment_status_idx on public.tournament_teams (payment_status);

-- Create trigger for updated_at
create trigger tournament_teams_updated_at
  before update on public.tournament_teams
  for each row
  execute function public.update_updated_at_column();

-- Enable Row Level Security
alter table public.tournament_teams enable row level security;

-- RLS policy: anyone can read teams of non-draft tournaments
create policy "Anyone can read teams of published tournaments"
  on public.tournament_teams for select
  using (
    exists (
      select 1 from public.tournaments
      where tournaments.id = tournament_teams.tournament_id
      and tournaments.status != 'draft'
    )
  );

-- RLS policy: users can create teams for open tournaments
create policy "Users can register teams for open tournaments"
  on public.tournament_teams for insert
  with check (
    auth.uid() is not null
    and auth.uid() = created_by_user_id
    and exists (
      select 1 from public.tournaments
      where tournaments.id = tournament_teams.tournament_id
      and tournaments.status = 'open'
    )
  );

-- RLS policy: users can update their own teams (before tournament closes)
create policy "Users can update own teams"
  on public.tournament_teams for update
  using (
    auth.uid() = created_by_user_id
    and exists (
      select 1 from public.tournaments
      where tournaments.id = tournament_teams.tournament_id
      and tournaments.status = 'open'
    )
  );

-- RLS policy: admin write operations
create policy "Admin can update tournament teams"
  on public.tournament_teams for update
  using (false);

create policy "Admin can delete tournament teams"
  on public.tournament_teams for delete
  using (false);

-- ============================================================================
-- tournament_team_members table
-- ============================================================================
create table if not exists public.tournament_team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.tournament_teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  shadow_player_id uuid references public.shadow_players(id) on delete set null,
  role public.team_member_role not null,
  created_at timestamptz default now() not null,
  -- Check constraint: either user_id or shadow_player_id must be set, not both
  constraint member_identity_check check (
    (user_id is not null and shadow_player_id is null) or
    (user_id is null and shadow_player_id is not null)
  ),
  -- Ensure unique role per team (only one player1 and one player2 per team)
  unique (team_id, role)
);

-- Create indexes for tournament_team_members
create index tournament_team_members_team_id_idx on public.tournament_team_members (team_id);
create index tournament_team_members_user_id_idx on public.tournament_team_members (user_id);
create index tournament_team_members_shadow_player_id_idx on public.tournament_team_members (shadow_player_id);

-- Enable Row Level Security
alter table public.tournament_team_members enable row level security;

-- RLS policy: anyone can read members of teams in non-draft tournaments
create policy "Anyone can read members of published tournament teams"
  on public.tournament_team_members for select
  using (
    exists (
      select 1 from public.tournament_teams
      join public.tournaments on tournaments.id = tournament_teams.tournament_id
      where tournament_teams.id = tournament_team_members.team_id
      and tournaments.status != 'draft'
    )
  );

-- RLS policy: team creators can add members to their teams
create policy "Team creators can add members"
  on public.tournament_team_members for insert
  with check (
    exists (
      select 1 from public.tournament_teams
      join public.tournaments on tournaments.id = tournament_teams.tournament_id
      where tournament_teams.id = tournament_team_members.team_id
      and tournament_teams.created_by_user_id = auth.uid()
      and tournaments.status = 'open'
    )
  );

-- RLS policy: team creators can update members
create policy "Team creators can update members"
  on public.tournament_team_members for update
  using (
    exists (
      select 1 from public.tournament_teams
      join public.tournaments on tournaments.id = tournament_teams.tournament_id
      where tournament_teams.id = tournament_team_members.team_id
      and tournament_teams.created_by_user_id = auth.uid()
      and tournaments.status = 'open'
    )
  );

-- RLS policy: team creators can remove members
create policy "Team creators can remove members"
  on public.tournament_team_members for delete
  using (
    exists (
      select 1 from public.tournament_teams
      join public.tournaments on tournaments.id = tournament_teams.tournament_id
      where tournament_teams.id = tournament_team_members.team_id
      and tournament_teams.created_by_user_id = auth.uid()
      and tournaments.status = 'open'
    )
  );

-- RLS policy: admin write operations
create policy "Admin can manage tournament team members"
  on public.tournament_team_members for all
  using (false);

-- ============================================================================
-- tournament_results table
-- ============================================================================
create table if not exists public.tournament_results (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  team_id uuid references public.tournament_teams(id) on delete cascade not null,
  placement integer not null check (placement > 0),
  points_awarded integer not null default 0 check (points_awarded >= 0),
  created_at timestamptz default now() not null,
  -- Ensure unique placement per tournament
  unique (tournament_id, placement),
  -- Ensure team can only have one result per tournament
  unique (tournament_id, team_id)
);

-- Create indexes for tournament_results
create index tournament_results_tournament_id_idx on public.tournament_results (tournament_id);
create index tournament_results_team_id_idx on public.tournament_results (team_id);
create index tournament_results_placement_idx on public.tournament_results (placement);

-- Enable Row Level Security
alter table public.tournament_results enable row level security;

-- RLS policy: anyone can read results of non-draft tournaments
create policy "Anyone can read results of published tournaments"
  on public.tournament_results for select
  using (
    exists (
      select 1 from public.tournaments
      where tournaments.id = tournament_results.tournament_id
      and tournaments.status != 'draft'
    )
  );

-- RLS policy: admin write operations only
create policy "Admin can insert tournament results"
  on public.tournament_results for insert
  with check (false);

create policy "Admin can update tournament results"
  on public.tournament_results for update
  using (false);

create policy "Admin can delete tournament results"
  on public.tournament_results for delete
  using (false);
