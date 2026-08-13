create table if not exists public.post_replies (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  source_language text not null check (source_language in ('zh-TW','zh-CN','th','en','ko','ja')),
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_notifications (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  report_count integer not null default 5,
  status text not null default 'pending' check (status in ('pending','restored','hidden')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  unique (post_id)
);

create index if not exists idx_post_replies_post_created on public.post_replies(post_id, created_at);
create index if not exists idx_moderation_notifications_status_created on public.moderation_notifications(status, created_at desc);

create or replace function public.hide_post_after_report_threshold()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  total_reports integer;
begin
  select count(*)::integer into total_reports
  from public.reports
  where post_id = new.post_id and status = 'open';

  if total_reports >= 5 then
    update public.posts
    set status = 'hidden', updated_at = now()
    where id = new.post_id and status = 'published';

    insert into public.moderation_notifications(post_id, report_count, status)
    values (new.post_id, total_reports, 'pending')
    on conflict (post_id) do update
      set report_count = excluded.report_count,
          status = 'pending',
          reviewed_at = null,
          reviewed_by = null;
  end if;
  return new;
end;
$$;

drop trigger if exists hide_post_after_five_reports on public.reports;
create trigger hide_post_after_five_reports
after insert on public.reports
for each row execute function public.hide_post_after_report_threshold();

create or replace function public.review_reported_post(notification_id bigint, decision text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_post_id bigint;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;
  if decision not in ('restored', 'hidden') then
    raise exception 'INVALID_MODERATION_DECISION';
  end if;

  select post_id into target_post_id
  from public.moderation_notifications
  where id = notification_id and status = 'pending'
  for update;

  if target_post_id is null then
    raise exception 'MODERATION_NOTIFICATION_NOT_FOUND';
  end if;

  update public.posts
  set status = case when decision = 'restored' then 'published'::public.post_status else 'hidden'::public.post_status end,
      updated_at = now()
  where id = target_post_id;

  update public.reports
  set status = case when decision = 'restored' then 'dismissed' else 'resolved' end
  where post_id = target_post_id and status = 'open';

  update public.moderation_notifications
  set status = decision, reviewed_at = now(), reviewed_by = auth.uid()
  where id = notification_id;
end;
$$;

alter table public.post_replies enable row level security;
alter table public.moderation_notifications enable row level security;

create policy "replies follow visible posts" on public.post_replies for select
using (exists (
  select 1 from public.posts
  where posts.id = post_replies.post_id
    and (posts.status = 'published' or posts.user_id = auth.uid() or public.is_admin())
));

create policy "fans reply to published posts" on public.post_replies for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.posts where posts.id = post_replies.post_id and posts.status = 'published')
);

create policy "reply owners delete" on public.post_replies for delete to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "admins read moderation notifications" on public.moderation_notifications for select to authenticated
using (public.is_admin());

create policy "admins review moderation notifications" on public.moderation_notifications for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins resolve reports" on public.reports for update to authenticated
using (public.is_admin()) with check (public.is_admin());

grant select on public.post_replies to anon, authenticated;
grant insert, delete on public.post_replies to authenticated;
grant select, update on public.moderation_notifications to authenticated;
grant update on public.reports to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.review_reported_post(bigint, text) to authenticated;

alter publication supabase_realtime add table public.post_replies;
alter publication supabase_realtime add table public.moderation_notifications;
