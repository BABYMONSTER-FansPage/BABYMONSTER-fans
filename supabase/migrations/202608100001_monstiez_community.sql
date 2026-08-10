create type public.fan_role as enum ('monstiez', 'admin', 'artist');
create type public.post_status as enum ('published', 'hidden', 'pending');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 24),
  role public.fan_role not null default 'monstiez',
  created_at timestamptz not null default now()
);

create table public.posts (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 500),
  source_language text not null check (source_language in ('zh-TW','zh-CN','th','en','ko','ja')),
  status public.post_status not null default 'published',
  updated_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.post_likes (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create view public.post_like_counts with (security_barrier = true) as
select post_id, count(*)::bigint as likes from public.post_likes group by post_id;

create table public.post_translations (
  post_id bigint not null references public.posts(id) on delete cascade,
  target_language text not null check (target_language in ('zh-TW','zh-CN','th','en','ko','ja')),
  translated_body text not null,
  provider text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, target_language)
);

create table public.reports (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create table public.announcements (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  locale text not null check (locale in ('zh-TW','zh-CN','th','en','ko','ja')),
  published_at timestamptz not null default now(),
  starts_at timestamptz,
  ends_at timestamptz,
  pinned boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null
);

create index idx_posts_status_created_at on public.posts(status, created_at desc);
create index idx_reports_status_created_at on public.reports(status, created_at desc);
create index idx_announcements_locale_published on public.announcements(locale, pinned desc, published_at desc);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.create_fan_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles(id, nickname)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'nickname', split_part(coalesce(new.email, 'MONSTIEZ'), '@', 1)), 24));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.create_fan_profile();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_translations enable row level security;
alter table public.reports enable row level security;
alter table public.announcements enable row level security;

create policy "profiles visible" on public.profiles for select using (true);
create policy "published posts visible" on public.posts for select using (status = 'published' or user_id = auth.uid() or public.is_admin());
create policy "fans create posts" on public.posts for insert to authenticated with check (user_id = auth.uid() and status = 'published');
create policy "owners edit posts" on public.posts for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "owners delete posts" on public.posts for delete to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "own likes visible" on public.post_likes for select using (user_id = auth.uid() or public.is_admin());
create policy "fans like" on public.post_likes for insert to authenticated with check (user_id = auth.uid());
create policy "fans unlike" on public.post_likes for delete to authenticated using (user_id = auth.uid());
create policy "translations visible" on public.post_translations for select using (true);
create policy "fans report" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "admins read reports" on public.reports for select to authenticated using (public.is_admin());
create policy "announcements visible" on public.announcements for select using ((starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy "admins manage announcements" on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.profiles, public.posts, public.post_like_counts, public.post_translations, public.announcements to anon, authenticated;
grant select on public.post_likes to authenticated;
grant insert, update, delete on public.posts, public.post_likes, public.reports to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter publication supabase_realtime add table public.posts, public.post_likes, public.announcements;
