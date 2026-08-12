create table if not exists public.nickname_blacklist (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 2 and 24),
  normalized_name text generated always as (lower(btrim(name))) stored unique,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

insert into public.nickname_blacklist (name)
values ('ahyeon')
on conflict (normalized_name) do nothing;

-- Existing exact matches and duplicates receive a neutral, unique placeholder.
-- The user can choose another available nickname after signing in.
update public.profiles p
set nickname = 'MONSTIEZ-' || substr(replace(p.id::text, '-', ''), 1, 15)
where exists (
  select 1 from public.nickname_blacklist b
  where b.normalized_name = lower(btrim(p.nickname))
);

with ranked as (
  select id, row_number() over (
    partition by lower(btrim(nickname))
    order by created_at, id
  ) as duplicate_number
  from public.profiles
)
update public.profiles p
set nickname = 'MONSTIEZ-' || substr(replace(p.id::text, '-', ''), 1, 15)
from ranked r
where p.id = r.id and r.duplicate_number > 1;

create unique index if not exists profiles_nickname_normalized_unique
on public.profiles ((lower(btrim(nickname))));

create or replace function public.nickname_availability(candidate text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  clean_name text := btrim(coalesce(candidate, ''));
  normalized text := lower(clean_name);
begin
  if char_length(clean_name) < 2 or char_length(clean_name) > 24 then
    return 'invalid';
  end if;
  if exists (
    select 1 from public.nickname_blacklist
    where normalized_name = normalized
  ) then
    return 'blocked';
  end if;
  if exists (
    select 1 from public.profiles
    where lower(btrim(nickname)) = normalized
      and (auth.uid() is null or id <> auth.uid())
  ) then
    return 'taken';
  end if;
  return 'available';
end;
$$;

create or replace function public.enforce_nickname_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  status text;
begin
  new.nickname := btrim(new.nickname);
  status := public.nickname_availability(new.nickname);
  if status = 'invalid' then
    raise exception using errcode = 'P0001', message = 'NICKNAME_INVALID';
  elsif status = 'blocked' then
    raise exception using errcode = 'P0001', message = 'NICKNAME_BLOCKED';
  elsif status = 'taken' then
    raise exception using errcode = '23505', message = 'NICKNAME_TAKEN';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_profile_nickname_rules on public.profiles;
create trigger enforce_profile_nickname_rules
before insert or update of nickname on public.profiles
for each row execute procedure public.enforce_nickname_rules();

create or replace function public.create_fan_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_nickname text;
  provider_name text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
  availability text;
begin
  requested_nickname := left(btrim(coalesce(
    nullif(new.raw_user_meta_data ->> 'nickname', ''),
    split_part(coalesce(new.email, 'MONSTIEZ'), '@', 1)
  )), 24);
  availability := public.nickname_availability(requested_nickname);

  -- Social providers may supply a duplicate display name. Give those users a
  -- unique temporary name and ask them to choose a nickname after sign-in.
  if provider_name <> 'email' and availability <> 'available' then
    requested_nickname := 'MONSTIEZ-' || substr(replace(new.id::text, '-', ''), 1, 15);
  end if;

  insert into public.profiles(id, nickname)
  values (new.id, requested_nickname);
  return new;
end;
$$;

alter table public.nickname_blacklist enable row level security;

drop policy if exists "admins view nickname blacklist" on public.nickname_blacklist;
create policy "admins view nickname blacklist" on public.nickname_blacklist
for select to authenticated using (public.is_admin());

drop policy if exists "admins manage nickname blacklist" on public.nickname_blacklist;
create policy "admins manage nickname blacklist" on public.nickname_blacklist
for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant execute on function public.nickname_availability(text) to anon, authenticated;
grant select, insert, update, delete on public.nickname_blacklist to authenticated;
grant usage, select on sequence public.nickname_blacklist_id_seq to authenticated;
