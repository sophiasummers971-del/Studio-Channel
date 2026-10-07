-- Studio Channel owner authentication and authenticated RLS boundary.
-- No owner identity is hardcoded in source. Bootstrap one row in studio_operators
-- after the owner completes Supabase Auth.

create table if not exists public.studio_operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.studio_operators enable row level security;
revoke all on table public.studio_operators from anon, authenticated;
grant select on table public.studio_operators to authenticated;

drop policy if exists "operator can read own membership" on public.studio_operators;
create policy "operator can read own membership"
  on public.studio_operators
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

do $$
declare
  tbl text;
  pol record;
begin
  for tbl in select unnest(array[
    'content_items',
    'workflow_runs',
    'approval_batches',
    'approval_items',
    'test_results',
    'test_issues',
    'deployment_checklist',
    'rollout_steps',
    'rollout_entry_criteria',
    'rollout_checkpoints',
    'publish_jobs'
  ]) loop
    execute format('alter table public.%I enable row level security', tbl);

    for pol in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = tbl
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, tbl);
    end loop;

    execute format('revoke all on table public.%I from anon, authenticated', tbl);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', tbl);

    execute format(
      'create policy %I on public.%I for select to authenticated using (exists (select 1 from public.studio_operators so where so.user_id = (select auth.uid())))',
      'operator_select_' || tbl,
      tbl
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (exists (select 1 from public.studio_operators so where so.user_id = (select auth.uid())))',
      'operator_insert_' || tbl,
      tbl
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (exists (select 1 from public.studio_operators so where so.user_id = (select auth.uid()))) with check (exists (select 1 from public.studio_operators so where so.user_id = (select auth.uid())))',
      'operator_update_' || tbl,
      tbl
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (exists (select 1 from public.studio_operators so where so.user_id = (select auth.uid())))',
      'operator_delete_' || tbl,
      tbl
    );
  end loop;
end $$;

-- Account connection metadata is read-only from the browser.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'account_connections'
  loop
    execute format('drop policy if exists %I on public.account_connections', pol.policyname);
  end loop;
end $$;

revoke all on table public.account_connections from anon, authenticated;
grant select on table public.account_connections to authenticated;

create policy "operator_select_account_connections"
  on public.account_connections
  for select
  to authenticated
  using (exists (
    select 1
    from public.studio_operators so
    where so.user_id = (select auth.uid())
  ));

-- OAuth secrets and anti-forgery state remain service-role only.
revoke all on table public.oauth_credentials from anon, authenticated;
revoke all on table public.oauth_states from anon, authenticated;
