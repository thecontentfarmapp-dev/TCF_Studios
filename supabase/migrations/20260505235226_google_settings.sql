-- Key-value settings store (used for Google refresh token etc.)
create table settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table settings enable row level security;

create policy "Admin full access to settings" on settings
  for all using (public.get_my_role() = 'admin');

-- Bookings table — tracks discovery calls booked by leads
create table bookings (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete set null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  brand_name text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  google_event_id text,
  meet_link text,
  intake_summary text,
  created_at timestamptz not null default now()
);

alter table bookings enable row level security;

create policy "Admin full access to bookings" on bookings
  for all using (public.get_my_role() = 'admin');

create index idx_bookings_brand_id on bookings(brand_id);
create index idx_bookings_start_time on bookings(start_time);
