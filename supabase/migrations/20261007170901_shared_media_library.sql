-- Shared publish media library.
-- Public download URLs are required by external publishing providers.
-- Upload/update/delete remain restricted to authenticated Studio operators.

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  content_id uuid references public.content_items(id) on delete set null,
  platform text,
  content_type text not null,
  file_name text not null,
  file_size bigint,
  storage_bucket text not null,
  storage_path text not null unique,
  public_url text not null,
  alt_text text,
  label text,
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.media_assets enable row level security;

alter table public.content_items
  add column if not exists media_asset_id uuid
  references public.media_assets(id) on delete set null;

drop policy if exists "Studio operators can read media assets" on public.media_assets;
create policy "Studio operators can read media assets"
on public.media_assets for select
to authenticated
using (
  exists (
    select 1
    from public.studio_operators so
    where so.user_id = (select auth.uid())
  )
);

drop policy if exists "Studio operators can insert media assets" on public.media_assets;
create policy "Studio operators can insert media assets"
on public.media_assets for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and exists (
    select 1
    from public.studio_operators so
    where so.user_id = (select auth.uid())
  )
);

drop policy if exists "Studio operators can update media assets" on public.media_assets;
create policy "Studio operators can update media assets"
on public.media_assets for update
to authenticated
using (
  exists (
    select 1
    from public.studio_operators so
    where so.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.studio_operators so
    where so.user_id = (select auth.uid())
  )
);

drop policy if exists "Studio operators can delete media assets" on public.media_assets;
create policy "Studio operators can delete media assets"
on public.media_assets for delete
to authenticated
using (
  exists (
    select 1
    from public.studio_operators so
    where so.user_id = (select auth.uid())
  )
);

grant select, insert, update, delete on public.media_assets to authenticated;

drop policy if exists "Studio operators can upload public media" on storage.objects;
create policy "Studio operators can upload public media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'studio-media-public'
  and exists (
    select 1
    from public.studio_operators so
    where so.user_id = (select auth.uid())
  )
);

drop policy if exists "Studio operators can update public media" on storage.objects;
create policy "Studio operators can update public media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'studio-media-public'
  and exists (
    select 1
    from public.studio_operators so
    where so.user_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'studio-media-public'
  and exists (
    select 1
    from public.studio_operators so
    where so.user_id = (select auth.uid())
  )
);

drop policy if exists "Studio operators can delete public media" on storage.objects;
create policy "Studio operators can delete public media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'studio-media-public'
  and exists (
    select 1
    from public.studio_operators so
    where so.user_id = (select auth.uid())
  )
);

create index if not exists idx_content_items_media_asset
  on public.content_items(media_asset_id);

create index if not exists idx_media_assets_content
  on public.media_assets(content_id);

create index if not exists idx_media_assets_uploaded_by
  on public.media_assets(uploaded_by);
