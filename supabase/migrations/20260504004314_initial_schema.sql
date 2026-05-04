-- TCF Studios Production Management System
-- Initial Schema Migration

-- ============================================================
-- ENUMS
-- ============================================================

create type brand_status as enum (
  'lead', 'in_conversation', 'proposal_sent', 'negotiating', 'signed', 'active', 'alumni'
);

create type brand_source as enum (
  'website_form', 'referral', 'outbound', 'other'
);

create type creator_status as enum (
  'prospect', 'in_conversation', 'soft_commitment', 'signed', 'active', 'alumni'
);

create type season_status as enum (
  'development', 'pre_production', 'production', 'post', 'distribution', 'complete'
);

create type episode_phase as enum (
  'commissioning', 'development', 'pre_production', 'production', 'post', 'distribution', 'publishing', 'evaluation'
);

create type script_status as enum (
  'draft', 'in_review', 'creator_approved', 'brand_approved', 'locked'
);

create type shoot_status as enum (
  'scheduled', 'complete', 'cancelled'
);

create type invoice_type as enum (
  'deposit', 'final', 'custom'
);

create type invoice_status as enum (
  'draft', 'sent', 'paid', 'overdue'
);

create type brief_status as enum (
  'draft', 'sent', 'approved', 'rejected'
);

create type publish_platform as enum (
  'tiktok', 'instagram_reels', 'instagram_stories', 'youtube_shorts'
);

create type user_role as enum (
  'admin', 'brand', 'creator'
);

-- ============================================================
-- BRANDS
-- ============================================================

create table brands (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_name text not null,
  industry text,
  website text,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  status brand_status not null default 'lead',
  notes text,
  source brand_source not null default 'other'
);

-- ============================================================
-- CREATORS
-- ============================================================

create table creators (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  instagram_handle text,
  tiktok_handle text,
  youtube_handle text,
  niche text,
  audience_size integer,
  status creator_status not null default 'prospect',
  slot text,
  deal_memo_signed boolean not null default false,
  notes text
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null,
  full_name text,
  role user_role not null default 'admin',
  brand_id uuid references brands(id) on delete set null,
  creator_id uuid references creators(id) on delete set null
);

-- ============================================================
-- BRAND BRIEFS
-- ============================================================

create table brand_briefs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  product_name text not null,
  campaign_goal text,
  story_angle text,
  deliverables text,
  usage_rights text,
  budget numeric(10,2),
  timeline_start date,
  timeline_end date,
  status brief_status not null default 'draft'
);

-- ============================================================
-- SEASONS
-- ============================================================

create table seasons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  show_bible text,
  creator_id uuid references creators(id) on delete set null,
  brand_id uuid references brands(id) on delete set null,
  brief_id uuid references brand_briefs(id) on delete set null,
  episode_count integer not null default 0,
  format text,
  status season_status not null default 'development',
  greenlit_at timestamptz,
  wrapped_at timestamptz
);

-- ============================================================
-- EPISODES
-- ============================================================

create table episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  number integer not null,
  title text,
  logline text,
  phase episode_phase not null default 'commissioning',
  due_date date,
  publish_date date,
  published_at timestamptz,
  unique(season_id, number)
);

-- ============================================================
-- SCRIPTS
-- ============================================================

create table scripts (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  content text,
  status script_status not null default 'draft',
  creator_approved_at timestamptz,
  brand_approved_at timestamptz,
  notes text,
  unique(episode_id, version)
);

-- ============================================================
-- SHOOT DAYS
-- ============================================================

create table shoot_days (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,
  call_time time,
  location_name text,
  location_notes text,
  shot_list text,
  call_sheet_url text,
  episodes_covered uuid[] default '{}',
  status shoot_status not null default 'scheduled'
);

-- ============================================================
-- INVOICES
-- ============================================================

create sequence invoice_number_seq start 1;

create table invoices (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete restrict,
  season_id uuid references seasons(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  invoice_number text not null unique default ('TCF-' || lpad(nextval('invoice_number_seq')::text, 3, '0')),
  amount numeric(10,2) not null,
  type invoice_type not null default 'custom',
  status invoice_status not null default 'draft',
  due_date date,
  paid_at timestamptz,
  stripe_invoice_id text,
  notes text
);

-- ============================================================
-- PUBLISH RECORDS
-- ============================================================

create table publish_records (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  platform publish_platform not null,
  url text,
  caption text,
  hashtags text,
  thumbnail_url text,
  scheduled_at timestamptz,
  published_at timestamptz,
  views integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  retention_rate numeric(5,2),
  last_synced_at timestamptz
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on profiles
  for each row execute function handle_updated_at();

create trigger set_updated_at before update on brands
  for each row execute function handle_updated_at();

create trigger set_updated_at before update on creators
  for each row execute function handle_updated_at();

create trigger set_updated_at before update on brand_briefs
  for each row execute function handle_updated_at();

create trigger set_updated_at before update on seasons
  for each row execute function handle_updated_at();

create trigger set_updated_at before update on episodes
  for each row execute function handle_updated_at();

create trigger set_updated_at before update on scripts
  for each row execute function handle_updated_at();

create trigger set_updated_at before update on invoices
  for each row execute function handle_updated_at();

create trigger set_updated_at before update on publish_records
  for each row execute function handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when new.raw_user_meta_data->>'role' in ('admin', 'brand', 'creator')
      then (new.raw_user_meta_data->>'role')::public.user_role
      else 'admin'::public.user_role
    end
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table brands enable row level security;
alter table creators enable row level security;
alter table brand_briefs enable row level security;
alter table seasons enable row level security;
alter table episodes enable row level security;
alter table scripts enable row level security;
alter table shoot_days enable row level security;
alter table invoices enable row level security;
alter table publish_records enable row level security;

-- Helper functions (security definer so they bypass RLS when called)
create or replace function get_my_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function get_my_brand_id()
returns uuid as $$
  select brand_id from profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function get_my_creator_id()
returns uuid as $$
  select creator_id from profiles where id = auth.uid();
$$ language sql security definer stable;

-- PROFILES policies
create policy "Users can view their own profile" on profiles
  for select using (id = auth.uid());

create policy "Admin can view all profiles" on profiles
  for select using (get_my_role() = 'admin');

create policy "Users can update their own profile" on profiles
  for update using (id = auth.uid());

create policy "Admin can manage all profiles" on profiles
  for all using (get_my_role() = 'admin');

-- BRANDS policies
create policy "Admin full access to brands" on brands
  for all using (get_my_role() = 'admin');

create policy "Brand users see their own brand" on brands
  for select using (
    get_my_role() = 'brand' and id = get_my_brand_id()
  );

-- CREATORS policies
create policy "Admin full access to creators" on creators
  for all using (get_my_role() = 'admin');

create policy "Creator sees own profile" on creators
  for select using (
    get_my_role() = 'creator' and id = get_my_creator_id()
  );

-- BRAND_BRIEFS policies
create policy "Admin full access to brand_briefs" on brand_briefs
  for all using (get_my_role() = 'admin');

create policy "Brand sees their briefs" on brand_briefs
  for select using (
    get_my_role() = 'brand' and brand_id = get_my_brand_id()
  );

-- SEASONS policies
create policy "Admin full access to seasons" on seasons
  for all using (get_my_role() = 'admin');

create policy "Brand sees their seasons" on seasons
  for select using (
    get_my_role() = 'brand' and brand_id = get_my_brand_id()
  );

create policy "Creator sees their seasons" on seasons
  for select using (
    get_my_role() = 'creator' and creator_id = get_my_creator_id()
  );

-- EPISODES policies
create policy "Admin full access to episodes" on episodes
  for all using (get_my_role() = 'admin');

create policy "Brand sees episodes in their seasons" on episodes
  for select using (
    get_my_role() = 'brand' and exists (
      select 1 from seasons s
      where s.id = episodes.season_id
      and s.brand_id = get_my_brand_id()
    )
  );

create policy "Creator sees episodes in their seasons" on episodes
  for select using (
    get_my_role() = 'creator' and exists (
      select 1 from seasons s
      where s.id = episodes.season_id
      and s.creator_id = get_my_creator_id()
    )
  );

-- SCRIPTS policies
create policy "Admin full access to scripts" on scripts
  for all using (get_my_role() = 'admin');

create policy "Brand sees scripts in their episodes" on scripts
  for select using (
    get_my_role() = 'brand' and exists (
      select 1 from episodes e
      join seasons s on s.id = e.season_id
      where e.id = scripts.episode_id
      and s.brand_id = get_my_brand_id()
    )
  );

create policy "Brand can approve scripts" on scripts
  for update using (
    get_my_role() = 'brand' and exists (
      select 1 from episodes e
      join seasons s on s.id = e.season_id
      where e.id = scripts.episode_id
      and s.brand_id = get_my_brand_id()
    )
  );

create policy "Creator sees scripts in their episodes" on scripts
  for select using (
    get_my_role() = 'creator' and exists (
      select 1 from episodes e
      join seasons s on s.id = e.season_id
      where e.id = scripts.episode_id
      and s.creator_id = get_my_creator_id()
    )
  );

create policy "Creator can approve scripts" on scripts
  for update using (
    get_my_role() = 'creator' and exists (
      select 1 from episodes e
      join seasons s on s.id = e.season_id
      where e.id = scripts.episode_id
      and s.creator_id = get_my_creator_id()
    )
  );

-- SHOOT_DAYS policies
create policy "Admin full access to shoot_days" on shoot_days
  for all using (get_my_role() = 'admin');

create policy "Creator sees shoot days for their seasons" on shoot_days
  for select using (
    get_my_role() = 'creator' and exists (
      select 1 from seasons s
      where s.id = shoot_days.season_id
      and s.creator_id = get_my_creator_id()
    )
  );

-- INVOICES policies
create policy "Admin full access to invoices" on invoices
  for all using (get_my_role() = 'admin');

create policy "Brand sees their invoices" on invoices
  for select using (
    get_my_role() = 'brand' and brand_id = get_my_brand_id()
  );

-- PUBLISH_RECORDS policies
create policy "Admin full access to publish_records" on publish_records
  for all using (get_my_role() = 'admin');

create policy "Brand sees publish records in their episodes" on publish_records
  for select using (
    get_my_role() = 'brand' and exists (
      select 1 from episodes e
      join seasons s on s.id = e.season_id
      where e.id = publish_records.episode_id
      and s.brand_id = get_my_brand_id()
    )
  );

create policy "Creator sees publish records in their episodes" on publish_records
  for select using (
    get_my_role() = 'creator' and exists (
      select 1 from episodes e
      join seasons s on s.id = e.season_id
      where e.id = publish_records.episode_id
      and s.creator_id = get_my_creator_id()
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_brands_status on brands(status);
create index idx_brands_contact_email on brands(contact_email);
create index idx_creators_status on creators(status);
create index idx_creators_email on creators(email);
create index idx_seasons_brand_id on seasons(brand_id);
create index idx_seasons_creator_id on seasons(creator_id);
create index idx_seasons_status on seasons(status);
create index idx_episodes_season_id on episodes(season_id);
create index idx_episodes_phase on episodes(phase);
create index idx_scripts_episode_id on scripts(episode_id);
create index idx_scripts_status on scripts(status);
create index idx_shoot_days_season_id on shoot_days(season_id);
create index idx_shoot_days_date on shoot_days(date);
create index idx_invoices_brand_id on invoices(brand_id);
create index idx_invoices_status on invoices(status);
create index idx_publish_records_episode_id on publish_records(episode_id);
create index idx_profiles_role on profiles(role);
create index idx_profiles_brand_id on profiles(brand_id);
create index idx_profiles_creator_id on profiles(creator_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Sample Brand: Acme Co.
insert into brands (id, company_name, industry, website, contact_name, contact_email, contact_phone, status, source, notes)
values (
  '11111111-1111-1111-1111-111111111111',
  'Acme Co.',
  'Consumer Products',
  'https://acmeco.com',
  'Jane Smith',
  'jane@acmeco.com',
  '+1 (555) 000-1234',
  'active',
  'referral',
  'Sample brand for testing. Flagship client.'
);

-- Sample Creator: Alice Bleathman
insert into creators (id, name, email, phone, instagram_handle, tiktok_handle, niche, audience_size, status, slot, deal_memo_signed, notes)
values (
  '22222222-2222-2222-2222-222222222222',
  'Alice Bleathman',
  'alice@example.com',
  '+1 (555) 000-5678',
  '@alicebleathman_',
  '@alicebleathman_',
  'lifestyle',
  250000,
  'active',
  'S1',
  true,
  'Flagship creator. Excellent on camera, great audience engagement.'
);

-- Sample Season: The Ebook
insert into seasons (id, title, show_bible, creator_id, brand_id, episode_count, format, status, greenlit_at)
values (
  '33333333-3333-3333-3333-333333333333',
  'The Ebook',
  'A 30-episode vertical docucomedy series following Alice as she attempts to write, market, and sell her first ebook — sponsored by Acme Co.',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  30,
  '60-second vertical docucomedy',
  'production',
  now()
);

-- Sample Episodes (1-30 for The Ebook)
insert into episodes (season_id, number, title, phase, due_date)
select
  '33333333-3333-3333-3333-333333333333',
  n,
  'Episode ' || n,
  case
    when n <= 3 then 'post'::episode_phase
    when n <= 6 then 'production'::episode_phase
    when n <= 10 then 'pre_production'::episode_phase
    else 'development'::episode_phase
  end,
  (current_date + (n * 7))::date
from generate_series(1, 30) as n;

-- Sample script for Episode 1
insert into scripts (episode_id, version, content, status, creator_approved_at)
select
  e.id,
  1,
  'EPISODE 1: "The Big Idea" — BEAT 1: Alice sits at her laptop, staring at a blank page. BEAT 2: Alice types three words. Deletes them. BEAT 3: Alice holds up a whiteboard. BEAT 4: Alice looks at camera. ALICE: "Yeah I know." [END CARD: Acme Co. logo]',
  'creator_approved',
  now() - interval '2 days'
from episodes e
where e.season_id = '33333333-3333-3333-3333-333333333333'
and e.number = 1;

-- Sample shoot day
insert into shoot_days (season_id, date, call_time, location_name, location_notes, status)
values (
  '33333333-3333-3333-3333-333333333333',
  current_date + 7,
  '08:00:00',
  'The Content Farm HQ',
  'Main studio, ground floor. Parking on street.',
  'scheduled'
);

-- Sample invoice (deposit, already paid)
insert into invoices (brand_id, season_id, amount, type, status, due_date, paid_at)
values (
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  7500.00,
  'deposit',
  'paid',
  current_date - 30,
  current_date - 25
);
