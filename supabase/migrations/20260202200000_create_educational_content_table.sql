-- Create educational_content table to store dynamic educational content
-- Categories: rules, formats, general_info, videos

-- Create enum type for content categories
create type public.educational_content_category as enum ('rules', 'formats', 'general_info', 'videos');

create table if not exists public.educational_content (
  id uuid default gen_random_uuid() primary key,
  title_es text not null,
  title_en text not null,
  content_es text not null,
  content_en text not null,
  category public.educational_content_category not null,
  video_url text,
  sort_order integer not null default 0,
  created_at timestamptz default now() not null
);

-- Create index on category for efficient filtering
create index educational_content_category_idx on public.educational_content (category);

-- Create index on sort_order for efficient ordering
create index educational_content_sort_order_idx on public.educational_content (sort_order);

-- Enable Row Level Security
alter table public.educational_content enable row level security;

-- RLS policy: public read access
create policy "Anyone can read educational content"
  on public.educational_content for select
  using (true);

-- RLS policy: admin write operations
-- Note: service_role bypasses RLS entirely, so these policies apply to authenticated users only
-- For now, no authenticated users can write - all write operations go through service_role (server-side)
-- When an admin role system is implemented, update these policies to check admin status
create policy "Admin can insert educational content"
  on public.educational_content for insert
  with check (false);

create policy "Admin can update educational content"
  on public.educational_content for update
  using (false);

create policy "Admin can delete educational content"
  on public.educational_content for delete
  using (false);
