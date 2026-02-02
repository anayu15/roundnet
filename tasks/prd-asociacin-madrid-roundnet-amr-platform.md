# PRD: Asociación Madrid Roundnet (AMR) Platform

## Overview

A bilingual (Spanish/English) web platform for Madrid's Roundnet community. The platform serves as the central hub for tournament management, member training/leagues, global rankings, educational content, and coordinated bulk equipment orders. 

The system handles complex relational data including player profiles, shadow/ghost players, team compositions, annual ranking cycles with historical data, and manual payment tracking across multiple modules.

**Target Scale:** 100-500 active users, 5-15 tournaments/year, weekly training sessions.

## Goals

- Provide a public-facing informational hub for Roundnet in Madrid (rules, videos, tournament info)
- Enable seamless tournament registration with support for shadow/ghost players
- Restrict training and league ("Liguilla") participation to verified AMR members
- Maintain accurate, filterable global rankings with annual reset and historical preservation
- Coordinate bulk equipment orders to share shipping costs
- Empower admins with full control over users, payments, and all platform entities
- Support English and Spanish with URL-based locale switching
- Achieve zero ongoing hosting costs using free-tier services

## Tech Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Frontend | Next.js 14+ (App Router) | SSR for SEO, excellent i18n, free Vercel hosting |
| Styling | Tailwind CSS + shadcn/ui | Rapid development, accessible components |
| Backend/DB | Supabase (PostgreSQL) | Relational data, RLS for access control, free tier sufficient |
| Auth | Supabase Auth | Email/password + Google OAuth + custom username lookup |
| i18n | next-intl | Type-safe, server/client support, URL-based locales |
| Package Manager | pnpm | Fast, strict, disk-efficient |

## Quality Gates

These commands must pass for every user story:
- `pnpm typecheck` - TypeScript type checking
- `pnpm lint` - ESLint code quality

For UI stories, also include:
- Visual verification in browser using dev-browser skill

## User Stories

### Section 0: Project Foundation

### US-001: Initialize Next.js project with TypeScript and pnpm
As a developer, I want a properly configured Next.js 14+ project so that I have a solid foundation for development.

**Acceptance Criteria:**
- [ ] Next.js 14+ project created with App Router
- [ ] TypeScript configured with strict mode
- [ ] pnpm as package manager with lockfile
- [ ] ESLint configured with Next.js recommended rules
- [ ] Tailwind CSS installed and configured
- [ ] shadcn/ui initialized with default theme
- [ ] Project structure follows Next.js App Router conventions
- [ ] `pnpm typecheck` and `pnpm lint` scripts work

### US-002: Configure Supabase project and local development
As a developer, I want Supabase configured so that I can develop with a real database locally.

**Acceptance Criteria:**
- [ ] Supabase project created (or local dev setup with Supabase CLI)
- [ ] Environment variables configured (`.env.local` with Supabase URL and anon key)
- [ ] Supabase client initialized in the codebase
- [ ] Database connection verified with a simple query
- [ ] `.env.example` file created with placeholder values

### US-003: Set up internationalization (EN/ES)
As a user, I want to browse the site in English or Spanish so that I can use my preferred language.

**Acceptance Criteria:**
- [ ] `next-intl` installed and configured
- [ ] URL-based locale routing (`/es/*`, `/en/*`)
- [ ] Default locale set to Spanish (`es`)
- [ ] Language switcher component created
- [ ] Translation files structure created (`messages/es.json`, `messages/en.json`)
- [ ] At least one page renders translated content correctly

### US-004: Create base layout with navigation
As a user, I want a consistent navigation structure so that I can easily access all sections of the platform.

**Acceptance Criteria:**
- [ ] Root layout with header and footer
- [ ] Navigation menu with links to: Educational, Tournaments, Training/League, Rankings, Bulk Orders
- [ ] Mobile-responsive hamburger menu
- [ ] Language switcher in header
- [ ] Auth status indicator (login/logout/profile)
- [ ] Navigation labels are translated (EN/ES)

---

### Section 1: Authentication & User Management

### US-005: Implement user registration with unique username
As a visitor, I want to create an account with my full name as a unique username so that I can participate in the platform.

**Acceptance Criteria:**
- [ ] Registration form with fields: Full Name (required, unique), Email (optional), Password
- [ ] Full name uniqueness validated in real-time
- [ ] If email provided, email verification sent
- [ ] User created in Supabase Auth with username stored in user metadata
- [ ] Error handling for duplicate username
- [ ] Form validation with appropriate error messages (translated)

### US-006: Implement flexible login (username or email)
As a user, I want to log in with either my username or email so that I have flexibility in how I access my account.

**Acceptance Criteria:**
- [ ] Single input field that accepts username OR email
- [ ] System detects if input is email format or username
- [ ] For username: lookup user by username metadata, then authenticate
- [ ] For email: standard Supabase email auth
- [ ] Password field on same form
- [ ] Google OAuth button available
- [ ] Error messages for invalid credentials (translated)

### US-007: Implement Google OAuth login
As a user, I want to log in with my Google account so that I can access the platform quickly.

**Acceptance Criteria:**
- [ ] Google OAuth configured in Supabase
- [ ] "Sign in with Google" button on login page
- [ ] First-time Google users prompted to set their unique username
- [ ] Username uniqueness enforced for Google users
- [ ] Existing Google users logged in directly

### US-008: Create user profile page
As a user, I want to view and edit my profile so that I can manage my account information.

**Acceptance Criteria:**
- [ ] Profile page shows: username, email (if set), membership status, registration date
- [ ] Users can update their email (with verification)
- [ ] Users can change their password
- [ ] Users cannot change their username (admin only)
- [ ] Profile page accessible only when logged in

### US-009: Create admin user management dashboard
As an admin, I want to manage all users so that I can maintain the platform.

**Acceptance Criteria:**
- [ ] Admin-only page listing all users
- [ ] Search/filter users by name, email, membership status
- [ ] View user details (profile, membership status, linked shadow profiles)
- [ ] Edit user profile (including username)
- [ ] Grant/revoke membership status
- [ ] Link/unlink shadow profiles to user accounts
- [ ] Pagination for user list

---

### Section 2: Shadow/Ghost Players

### US-010: Create shadow player database schema
As an admin, I want shadow players stored in the database so that non-registered players can be tracked in tournaments and rankings.

**Acceptance Criteria:**
- [ ] `shadow_players` table created with: id, name, created_at, linked_user_id (nullable FK)
- [ ] Unique constraint on name (case-insensitive)
- [ ] Index on linked_user_id for efficient lookups
- [ ] RLS policies: public read, admin write

### US-011: Admin CRUD for shadow players
As an admin, I want to create, edit, and delete shadow players so that I can manage players who haven't registered.

**Acceptance Criteria:**
- [ ] Admin page to list all shadow players
- [ ] Create new shadow player form
- [ ] Edit shadow player name
- [ ] Delete shadow player (with warning if they have tournament history)
- [ ] View which user account (if any) is linked

### US-012: User claims shadow profile during registration
As a new user, I want to claim my existing shadow profile so that my historical data is preserved.

**Acceptance Criteria:**
- [ ] During registration, system checks if username matches any unlinked shadow player
- [ ] If match found, user shown option to claim the profile
- [ ] Claim request sent to admin for approval
- [ ] Admin can approve/reject claim from dashboard
- [ ] On approval, shadow player linked to user account
- [ ] User's historical results now appear on their profile

---

### Section 3: Educational Section (Public)

### US-013: Create educational content database schema
As an admin, I want educational content stored in the database so that I can manage it dynamically.

**Acceptance Criteria:**
- [ ] `educational_content` table: id, title_es, title_en, content_es, content_en, category, video_url (nullable), sort_order, created_at
- [ ] Categories: rules, formats, general_info, videos
- [ ] RLS: public read, admin write

### US-014: Build educational section public pages
As a visitor, I want to browse educational content so that I can learn about Roundnet.

**Acceptance Criteria:**
- [ ] `/[locale]/educational` page with category tabs/sections
- [ ] Content displayed in user's selected language
- [ ] Embedded video player for video content
- [ ] Responsive layout for mobile/desktop
- [ ] SEO metadata for each page

### US-015: Admin CRUD for educational content
As an admin, I want to manage educational content so that I can keep information up to date.

**Acceptance Criteria:**
- [ ] Admin page listing all educational content
- [ ] Create/edit form with fields for both languages
- [ ] Rich text editor for content
- [ ] Video URL field with embed preview
- [ ] Drag-and-drop reordering (sort_order)
- [ ] Delete content with confirmation

---

### Section 4: Membership System

### US-016: Create membership database schema
As an admin, I want membership data tracked so that I can manage AMR members.

**Acceptance Criteria:**
- [ ] `memberships` table: id, user_id (FK), status (pending/active/expired), applied_at, approved_at, expires_at, payment_reference
- [ ] `membership_payments` table: id, membership_id (FK), amount, payment_method (bizum/transfer), status (pending/verified), verified_at, verified_by
- [ ] RLS: users see own membership, admins see all

### US-017: User membership application flow
As a registered user, I want to apply for AMR membership so that I can access member-only features.

**Acceptance Criteria:**
- [ ] Membership application page showing payment info (Bizum number, bank transfer details)
- [ ] User submits application with payment reference
- [ ] Application status visible on user profile (pending/active/expired)
- [ ] Email notification to admins on new application (if email configured)

### US-018: Admin membership management
As an admin, I want to verify membership payments so that I can grant access to members.

**Acceptance Criteria:**
- [ ] Admin page listing all membership applications
- [ ] Filter by status (pending/active/expired)
- [ ] Mark payment as verified (records who verified and when)
- [ ] Set membership expiration date
- [ ] Revoke membership manually
- [ ] View payment history for each member

---

### Section 5: Tournament System

### US-019: Create tournament database schema
As an admin, I want tournaments stored with full relational data so that I can manage complex tournament structures.

**Acceptance Criteria:**
- [ ] `tournaments` table: id, name_es, name_en, description_es, description_en, date, location, registration_deadline, max_teams, category (mens/womens/mixed), status (draft/open/closed/completed), points_config (JSONB)
- [ ] `tournament_teams` table: id, tournament_id, team_name, created_by_user_id, registration_date, payment_status, payment_reference
- [ ] `tournament_team_members` table: id, team_id, user_id (nullable), shadow_player_id (nullable), role (player1/player2)
- [ ] `tournament_results` table: id, tournament_id, team_id, placement, points_awarded
- [ ] Check constraint: either user_id or shadow_player_id must be set, not both
- [ ] RLS: public read for non-draft tournaments, admin write

### US-020: Public tournament listing and details
As a visitor, I want to browse tournaments so that I can see upcoming and past events.

**Acceptance Criteria:**
- [ ] `/[locale]/tournaments` page listing all non-draft tournaments
- [ ] Filter by status (upcoming/completed) and category
- [ ] Tournament card shows: name, date, location, registration status, team count
- [ ] Tournament detail page with full description
- [ ] Registered teams list visible (with player names)
- [ ] Results visible for completed tournaments

### US-021: Tournament registration flow
As a logged-in user, I want to register a team for a tournament so that I can participate.

**Acceptance Criteria:**
- [ ] Registration button visible only for open tournaments
- [ ] User must be logged in to register
- [ ] Team registration form: team name, partner selection
- [ ] Partner options: search existing users, search shadow players, create new shadow player
- [ ] Creating new shadow player inline during registration
- [ ] Payment info displayed after registration
- [ ] Registration confirmation with payment reference field
- [ ] User can view/edit their registration until deadline

### US-022: Admin tournament CRUD
As an admin, I want to create and manage tournaments so that I can organize events.

**Acceptance Criteria:**
- [ ] Admin page listing all tournaments (including drafts)
- [ ] Create tournament form with all fields (both languages)
- [ ] Points configuration: define placement-to-points mapping (e.g., 1st=100, 2nd=80)
- [ ] Edit tournament details
- [ ] Change tournament status (draft→open→closed→completed)
- [ ] Delete tournament (with confirmation, warn if has registrations)

### US-023: Admin tournament participant management
As an admin, I want to manage tournament registrations so that I can track participants and payments.

**Acceptance Criteria:**
- [ ] View all registered teams for a tournament
- [ ] Mark payment as verified for each team
- [ ] Remove team from tournament
- [ ] Add team manually (for late registrations)
- [ ] Export participant list (CSV)

### US-024: Admin tournament results entry
As an admin, I want to enter tournament results so that rankings are updated.

**Acceptance Criteria:**
- [ ] Results entry page for completed tournaments
- [ ] Assign placement to each team (1st, 2nd, 3rd, etc.)
- [ ] Points auto-calculated based on tournament's points config
- [ ] Bulk save results
- [ ] Results entry triggers ranking recalculation
- [ ] Lock results after entry (require unlock to edit)

---

### Section 6: Training & Liguilla (Member-Only)

### US-025: Create training and liguilla database schema
As an admin, I want training and league data stored so that I can manage member activities.

**Acceptance Criteria:**
- [ ] `training_sessions` table: id, date, day_of_week (monday/wednesday), notes_es, notes_en, status (scheduled/completed/cancelled)
- [ ] `training_attendance` table: id, session_id, user_id, attended (boolean)
- [ ] `liguilla_rounds` table: id, training_session_id (FK to Monday sessions), points_config (JSONB)
- [ ] `liguilla_groups` table: id, round_id, group_number, is_auto_generated (boolean)
- [ ] `liguilla_group_members` table: id, group_id, user_id, shadow_player_id (nullable)
- [ ] `liguilla_results` table: id, group_id, player_user_id, player_shadow_id, wins, losses, points_awarded
- [ ] RLS: members can read, admins write

### US-026: Member-only training section access
As a member, I want to access the training section so that I can view schedules and participate in the Liguilla.

**Acceptance Criteria:**
- [ ] `/[locale]/training` route protected - requires authenticated member
- [ ] Non-members see "Members Only" message with link to apply
- [ ] Members see training schedule and Liguilla information

### US-027: Training schedule display
As a member, I want to see the training schedule so that I know when to attend.

**Acceptance Criteria:**
- [ ] Calendar or list view of upcoming training sessions
- [ ] Sessions show: date, day (Mon/Wed), status, notes
- [ ] Past sessions show attendance records
- [ ] Member can mark intention to attend (optional feature)

### US-028: Liguilla auto-seeding algorithm
As an admin, I want automatic group generation based on recent performance so that competitive balance is maintained.

**Acceptance Criteria:**
- [ ] Algorithm inputs: list of participating players, their recent Liguilla performance
- [ ] Performance metric: win rate in last N Liguilla sessions (configurable, default 4)
- [ ] Groups of 4 players generated
- [ ] Top performers distributed across groups (serpentine/snake draft style)
- [ ] Handle odd numbers (groups of 3 if needed)
- [ ] Algorithm is deterministic (same inputs = same outputs)

### US-029: Admin Liguilla management
As an admin, I want to manage Monday Liguilla sessions so that the league runs smoothly.

**Acceptance Criteria:**
- [ ] Create Liguilla round for a Monday training session
- [ ] Select participating players (from members and shadow players)
- [ ] Run auto-seeding to generate groups
- [ ] View generated groups
- [ ] Manually edit groups (move players between groups)
- [ ] Set points configuration for this round
- [ ] Delete/recreate groups if needed

### US-030: Admin Liguilla results entry
As an admin, I want to enter Liguilla results so that league rankings update.

**Acceptance Criteria:**
- [ ] Results entry UI per group
- [ ] Enter wins/losses for each player in group
- [ ] Points auto-calculated per config
- [ ] Save results and trigger ranking update
- [ ] View historical Liguilla results

### US-031: Admin training session management
As an admin, I want to manage training sessions so that I can maintain the schedule.

**Acceptance Criteria:**
- [ ] Create/edit/delete training sessions
- [ ] Bulk create sessions (e.g., all Mondays and Wednesdays for next month)
- [ ] Mark session as cancelled with optional note
- [ ] Record attendance after session

---

### Section 7: Global Rankings

### US-032: Create ranking database schema
As an admin, I want rankings stored with historical data so that annual cycles and history are preserved.

**Acceptance Criteria:**
- [ ] `ranking_entries` table: id, year, category (mens_individual/womens_individual/mens_team/womens_team/mixed_team), entity_type (player/team), user_id (nullable), shadow_player_id (nullable), team_id (nullable), total_points, rank_position
- [ ] `ranking_events` table: id, ranking_entry_id, event_type (tournament/liguilla), event_id, points_earned, event_date
- [ ] Composite unique constraint on (year, category, entity_id)
- [ ] Indexes for efficient ranking queries
- [ ] RLS: public read

### US-033: Public ranking display
As a visitor, I want to view global rankings so that I can see top players and teams.

**Acceptance Criteria:**
- [ ] `/[locale]/rankings` page with category tabs
- [ ] Categories: Men's Individual, Women's Individual, Men's Teams, Women's Teams, Mixed Teams
- [ ] Default to current year
- [ ] Year filter dropdown to view historical rankings
- [ ] Ranking table shows: position, name, total points
- [ ] Click player/team to view profile

### US-034: Player ranking profile
As a visitor, I want to view a player's ranking profile so that I can see their history.

**Acceptance Criteria:**
- [ ] Player profile page showing: name, current rank per category, total points
- [ ] Match/event history table: event name, date, placement, points earned
- [ ] Filter history by year
- [ ] Charts showing ranking progression over time (optional enhancement)

### US-035: Ranking calculation engine
As a developer, I want ranking calculations automated so that rankings stay accurate.

**Acceptance Criteria:**
- [ ] Function to recalculate rankings for a given year and category
- [ ] Triggered after tournament results entry
- [ ] Triggered after Liguilla results entry
- [ ] Handles ties appropriately (same points = same rank)
- [ ] Updates rank_position for all affected entries
- [ ] Efficient: only recalculates affected category/year

### US-036: Annual ranking reset
As an admin, I want to reset rankings annually so that each year starts fresh.

**Acceptance Criteria:**
- [ ] Admin action to finalize current year rankings
- [ ] Previous year data preserved and queryable
- [ ] New year starts with zero points for all
- [ ] Historical rankings remain accessible via year filter
- [ ] Confirmation dialog with warning

---

### Section 8: Bulk Orders

### US-037: Create bulk order database schema
As an admin, I want bulk orders tracked so that I can coordinate group purchases.

**Acceptance Criteria:**
- [ ] `bulk_order_windows` table: id, title_es, title_en, description, status (open/closed/ordered/delivered), opens_at, closes_at, created_at
- [ ] `bulk_order_items` table: id, window_id, user_id, product_name, product_url, quantity, unit_price, payment_status, payment_reference
- [ ] `bulk_order_history` table: id, window_id, total_amount, shipping_cost, order_date, delivery_date, notes
- [ ] RLS: users see own items, admins see all

### US-038: Public bulk order window display
As a visitor, I want to see current and past bulk orders so that I can participate.

**Acceptance Criteria:**
- [ ] `/[locale]/bulk-orders` page
- [ ] Current open window prominently displayed (if any)
- [ ] Link to Premier Spike website
- [ ] Instructions on how to participate
- [ ] History of past orders (dates, status)

### US-039: User bulk order item submission
As a logged-in user, I want to submit items for a bulk order so that I can share shipping costs.

**Acceptance Criteria:**
- [ ] Form to add item: product URL, product name, quantity, unit price
- [ ] Only available during open order window
- [ ] User can view their submitted items
- [ ] User can edit/remove items until window closes
- [ ] Payment info displayed with reference field

### US-040: Admin bulk order management
As an admin, I want to manage bulk orders so that I can coordinate purchases.

**Acceptance Criteria:**
- [ ] Create/edit/delete order windows
- [ ] View all items in current window grouped by user
- [ ] Mark individual item payments as verified
- [ ] Close window (no more submissions)
- [ ] Mark order as placed (record order date)
- [ ] Mark order as delivered (record delivery date)
- [ ] View consolidated item list for placing order
- [ ] Export order list (CSV)

### US-041: Bulk order history
As a user, I want to see my past bulk order participation so that I can track my orders.

**Acceptance Criteria:**
- [ ] User profile section showing past bulk order items
- [ ] Status of each item (pending/paid/ordered/delivered)
- [ ] Filterable by order window

---

### Section 9: Admin Dashboard

### US-042: Create admin dashboard home
As an admin, I want a central dashboard so that I can quickly access admin functions.

**Acceptance Criteria:**
- [ ] `/[locale]/admin` route protected - requires admin role
- [ ] Dashboard shows quick stats: total users, active members, open tournaments, pending payments
- [ ] Quick links to: Users, Tournaments, Training, Rankings, Bulk Orders, Content
- [ ] Recent activity feed (new registrations, payment verifications)

### US-043: Implement admin role system
As an admin, I want role-based access so that only authorized users can access admin functions.

**Acceptance Criteria:**
- [ ] `user_roles` table or role field in user metadata
- [ ] Roles: user, member, admin
- [ ] Admin middleware for protected routes
- [ ] RLS policies enforce admin-only write access
- [ ] Super admin can grant/revoke admin role

### US-044: Global payment tracking dashboard
As an admin, I want a unified view of all pending payments so that I can track finances.

**Acceptance Criteria:**
- [ ] Dashboard page showing all pending payments across modules
- [ ] Filter by type: membership, tournament, bulk order
- [ ] Filter by date range
- [ ] Quick action to verify payment from this view
- [ ] Summary totals: pending amount, verified this month

---

### Section 10: Data Migration

### US-045: Create data migration tools
As an admin, I want to import existing spreadsheet data so that historical records are preserved.

**Acceptance Criteria:**
- [ ] CSV import tool for players (creates shadow players or users)
- [ ] CSV import tool for historical tournament results
- [ ] CSV import tool for historical ranking data by year
- [ ] Validation and error reporting during import
- [ ] Dry-run mode to preview import without committing
- [ ] Admin-only access to migration tools

## Functional Requirements

- FR-1: All public pages must be accessible without authentication
- FR-2: All content must be available in both English and Spanish
- FR-3: Usernames must be unique across the platform (case-insensitive)
- FR-4: Users can log in with either username or email (auto-detected)
- FR-5: Shadow players must be linkable to user accounts (one-to-one)
- FR-6: Tournament teams must have exactly 2 players (any combination of users/shadow players)
- FR-7: Liguilla groups must be editable after auto-generation
- FR-8: Rankings must preserve historical data when annual reset occurs
- FR-9: Payment status must be manually verifiable by admins only
- FR-10: All admin actions must be restricted by role-based access control
- FR-11: Bulk order windows must have defined open/close periods
- FR-12: Points configuration must be customizable per tournament/Liguilla round

## Non-Goals (Out of Scope)

- Automated payment processing (Stripe, PayPal) - all payments are manual Bizum/transfer
- Real-time tournament brackets/live scoring
- Mobile native apps (iOS/Android) - responsive web only
- Email notifications (can be added later, not MVP)
- Social features (comments, messaging between users)
- Custom themes or user preferences beyond language
- Integration with external ranking systems (SPR, etc.)
- Automatic Premier Spike product catalog sync
- Multi-tenant support (this is for AMR only)

## Technical Considerations

- **Database:** PostgreSQL via Supabase with Row-Level Security for access control
- **Auth:** Supabase Auth with custom username lookup via user metadata
- **Hosting:** Vercel (frontend) + Supabase (backend) - both have generous free tiers
- **i18n:** URL-based routing (`/es/*`, `/en/*`) with `next-intl`
- **State Management:** React Server Components + Supabase client for data fetching
- **Forms:** React Hook Form + Zod for validation
- **Tables:** TanStack Table for admin data grids
- **Date Handling:** date-fns with locale support

## Success Metrics

- All 5 sections (Educational, Tournaments, Training, Rankings, Bulk Orders) fully functional
- Admins can manage all entities without developer intervention
- Users can register, join tournaments, and view rankings
- Members can access training section and participate in Liguilla
- Historical data successfully migrated from spreadsheets
- Site fully functional in both English and Spanish
- Zero hosting costs achieved on free tiers
- All pages responsive on mobile and desktop

## Open Questions

1. Should there be email notifications for key events (tournament registration, membership approval)? Can be added post-MVP.
2. Should ranking profiles include charts/visualizations or is a table sufficient for MVP?
3. What is the exact formula for Liguilla points (wins vs losses weighting)?
4. Should there be a "forgot password" flow for username-only accounts (no email)?
5. What happens to a shadow player's history if they never claim their profile?