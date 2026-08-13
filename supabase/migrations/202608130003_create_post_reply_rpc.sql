create or replace function public.create_post_reply(
  target_post_id bigint,
  reply_body text,
  reply_language text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  viewer_id uuid := auth.uid();
  clean_body text := btrim(coalesce(reply_body, ''));
  new_reply_id bigint;
begin
  if viewer_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if char_length(clean_body) < 1 or char_length(clean_body) > 500 then
    raise exception using errcode = '22023', message = 'REPLY_INVALID';
  end if;
  if reply_language not in ('zh-TW','zh-CN','th','en','ko','ja') then
    raise exception using errcode = '22023', message = 'REPLY_LANGUAGE_INVALID';
  end if;
  if not exists (
    select 1 from public.posts
    where id = target_post_id and status = 'published'
  ) then
    raise exception using errcode = 'P0002', message = 'POST_NOT_AVAILABLE';
  end if;

  insert into public.post_replies(post_id, user_id, body, source_language)
  values (target_post_id, viewer_id, clean_body, reply_language)
  returning id into new_reply_id;

  return new_reply_id;
end;
$$;

revoke all on function public.create_post_reply(bigint, text, text) from public;
grant execute on function public.create_post_reply(bigint, text, text) to authenticated;
