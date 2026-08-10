create table if not exists public.site_content (
  key text primary key check (key in (
    'siteName',
    'siteTagline',
    'faviconUrl',
    'ogImageUrl',
    'heroKicker',
    'heroNote',
    'heroImageUrl',
    'storyLead',
    'storyBody',
    'aboutImageUrl',
    'memberPhotos',
    'events',
    'terms',
    'privacy'
  )),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create or replace function public.touch_site_content()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists on_site_content_updated on public.site_content;
create trigger on_site_content_updated before insert or update on public.site_content
for each row execute procedure public.touch_site_content();

alter table public.site_content enable row level security;

drop policy if exists "site content visible" on public.site_content;
create policy "site content visible" on public.site_content for select using (true);

drop policy if exists "admins manage site content" on public.site_content;
create policy "admins manage site content" on public.site_content for all to authenticated
using (public.is_admin()) with check (public.is_admin());

grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;
