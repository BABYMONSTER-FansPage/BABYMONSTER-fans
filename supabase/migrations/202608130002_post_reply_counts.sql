create or replace view public.post_reply_counts with (security_barrier = true) as
select post_id, count(*)::bigint as replies
from public.post_replies
group by post_id;

grant select on public.post_reply_counts to anon, authenticated;
