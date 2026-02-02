-- Create profiles table to store user profile data with unique full_name (username)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null unique,
  email text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create policy to allow users to view their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Create policy to allow users to update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create policy to allow insert during registration (service role or authenticated)
create policy "Enable insert for authenticated users only"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create policy to allow public read access for username uniqueness check
create policy "Allow public read for username check"
  on public.profiles for select
  using (true);

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  return new;
end;
$$;

-- Create trigger to automatically create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create index for faster username lookups
create index if not exists profiles_full_name_idx on public.profiles (lower(full_name));

-- Create function to update the updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create trigger to automatically update updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();
