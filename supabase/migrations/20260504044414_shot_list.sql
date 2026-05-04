-- Shot list migration

create type shot_type as enum (
  'wide', 'medium_wide', 'medium', 'medium_close', 'close_up', 'extreme_close_up',
  'over_the_shoulder', 'pov', 'insert', 'cutaway', 'establishing'
);

create type camera_angle as enum (
  'eye_level', 'high_angle', 'low_angle', 'dutch', 'birds_eye', 'worms_eye'
);

create type camera_movement as enum (
  'static', 'pan_left', 'pan_right', 'tilt_up', 'tilt_down',
  'dolly_in', 'dolly_out', 'orbit_left', 'orbit_right',
  'crane_up', 'crane_down', 'handheld', 'push_in', 'pull_out', 'tracking'
);

create type shot_status as enum ('not_shot', 'shot', 'approved');

create table shots (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  number integer not null,
  scene_beat text,
  shot_type shot_type,
  camera_angle camera_angle,
  camera_movement camera_movement,
  duration_seconds integer,
  description text,
  dialogue text,
  props text,
  notes text,
  storyboard_url text,
  storyboard_prompt text,
  status shot_status not null default 'not_shot',
  unique(episode_id, number)
);

create trigger set_updated_at before update on shots
  for each row execute function handle_updated_at();

alter table shots enable row level security;

create policy "Admin full access to shots" on shots
  for all using (public.get_my_role() = 'admin');

create policy "Creator sees shots for their episodes" on shots
  for select using (
    public.get_my_role() = 'creator' and exists (
      select 1 from public.episodes e
      join public.seasons s on s.id = e.season_id
      where e.id = shots.episode_id
      and s.creator_id = public.get_my_creator_id()
    )
  );

create index idx_shots_episode_id on shots(episode_id);
create index idx_shots_number on shots(episode_id, number);
