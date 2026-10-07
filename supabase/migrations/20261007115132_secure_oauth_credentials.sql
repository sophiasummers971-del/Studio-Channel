-- Studio Channel security foundation
-- Move OAuth credentials out of browser-readable account metadata and make OAuth state server-only.

create table if not exists public.oauth_credentials (
  provider text primary key references public.account_connections(provider) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  external_id text,
  updated_at timestamptz not null default now()
);

alter table public.oauth_credentials
  add column if not exists refresh_token_expires_at timestamptz;

alter table public.oauth_credentials enable row level security;
revoke all on table public.oauth_credentials from anon, authenticated;

create table if not exists public.oauth_states (
  state text primary key,
  provider text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.oauth_states enable row level security;
revoke all on table public.oauth_states from anon, authenticated;

insert into public.oauth_credentials (provider, access_token, refresh_token, expires_at, external_id, updated_at)
select provider, access_token, refresh_token, expires_at, external_id, now()
from public.account_connections
where access_token is not null and access_token <> ''
on conflict (provider) do update
set access_token = excluded.access_token,
    refresh_token = excluded.refresh_token,
    expires_at = excluded.expires_at,
    external_id = excluded.external_id,
    updated_at = now();

alter table public.account_connections
  drop column if exists access_token,
  drop column if exists refresh_token;

drop policy if exists "Enable read access for all users" on public.account_connections;
drop policy if exists "anon read connections" on public.account_connections;
drop policy if exists "anon write connections" on public.account_connections;
drop policy if exists "anon update connections" on public.account_connections;
drop policy if exists "public read connection status" on public.account_connections;

create policy "public read connection status"
  on public.account_connections
  for select
  to anon, authenticated
  using (true);

grant select on public.account_connections to anon, authenticated;
revoke insert, update, delete on public.account_connections from anon, authenticated;

alter function public.update_updated_at_column() set search_path = public;
alter function public.update_publish_jobs_updated_at() set search_path = public;
