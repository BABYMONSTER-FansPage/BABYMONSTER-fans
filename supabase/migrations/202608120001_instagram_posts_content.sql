alter table public.site_content drop constraint if exists site_content_key_check;

insert into public.site_content (key, value)
values (
  'instagramPosts',
  '{"ruka":["https://www.instagram.com/p/DbsLtoLmfWh/"]}'::jsonb
)
on conflict (key) do update
set value = excluded.value,
    updated_at = timezone('utc'::text, now())
where public.site_content.value is null
   or public.site_content.value = '[]'::jsonb
   or public.site_content.value = '{}'::jsonb;
