-- Create membership_payments table to track payment records for memberships
-- Payment methods: bizum, transfer
-- Status flow: pending -> verified

-- Create enum type for payment method
create type public.payment_method as enum ('bizum', 'transfer');

-- Create enum type for payment status
create type public.payment_status as enum ('pending', 'verified');

create table if not exists public.membership_payments (
  id uuid default gen_random_uuid() primary key,
  membership_id uuid references public.memberships(id) on delete cascade not null,
  amount numeric(10, 2) not null,
  payment_method public.payment_method not null,
  status public.payment_status not null default 'pending',
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null
);

-- Create index on membership_id for efficient lookups
create index membership_payments_membership_id_idx on public.membership_payments (membership_id);

-- Create index on status for filtering
create index membership_payments_status_idx on public.membership_payments (status);

-- Enable Row Level Security
alter table public.membership_payments enable row level security;

-- RLS policy: users can view payments for their own memberships
create policy "Users can view own membership payments"
  on public.membership_payments for select
  using (
    exists (
      select 1 from public.memberships
      where memberships.id = membership_payments.membership_id
      and memberships.user_id = auth.uid()
    )
  );

-- RLS policy: admin read all (service_role bypasses RLS)
-- Placeholder policy for when admin role system is implemented
create policy "Admin can view all membership payments"
  on public.membership_payments for select
  using (false);

-- RLS policy: users can create payment records for their own memberships
create policy "Users can create payment for own membership"
  on public.membership_payments for insert
  with check (
    exists (
      select 1 from public.memberships
      where memberships.id = membership_payments.membership_id
      and memberships.user_id = auth.uid()
    )
  );

-- RLS policy: admin write operations
-- Note: service_role bypasses RLS entirely, so these policies apply to authenticated users only
-- When an admin role system is implemented, update these policies to check admin status
create policy "Admin can update membership payments"
  on public.membership_payments for update
  using (false);

create policy "Admin can delete membership payments"
  on public.membership_payments for delete
  using (false);
