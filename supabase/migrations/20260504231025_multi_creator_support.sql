-- Add creator_ids array to seasons for multi-creator support.
-- creator_id (FK) remains as the primary/display creator.
-- creator_ids holds all attached creator UUIDs.

alter table seasons add column creator_ids uuid[] not null default '{}';

-- Backfill: populate creator_ids from existing creator_id
update seasons set creator_ids = array[creator_id] where creator_id is not null;

-- Update RLS policy: creators can see seasons where their id is in creator_ids
drop policy if exists "Creator sees their seasons" on seasons;

create policy "Creator sees their seasons" on seasons
  for select using (
    public.get_my_role() = 'creator' and (
      creator_id = public.get_my_creator_id() or
      public.get_my_creator_id() = any(creator_ids)
    )
  );

create index idx_seasons_creator_ids on seasons using gin(creator_ids);
