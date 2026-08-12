create table if not exists public.oauth_unlink_events (
  id bigint generated always as identity primary key,
  provider text not null check (provider in ('kakao')),
  external_user_id text not null,
  app_id text not null,
  referrer_type text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

alter table public.oauth_unlink_events enable row level security;

drop policy if exists "admins read oauth unlink events" on public.oauth_unlink_events;
create policy "admins read oauth unlink events"
on public.oauth_unlink_events for select to authenticated
using (public.is_admin());

grant select on public.oauth_unlink_events to authenticated;
