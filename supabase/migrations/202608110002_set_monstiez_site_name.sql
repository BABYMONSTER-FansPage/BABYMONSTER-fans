insert into public.site_content (key, value)
values
  ('siteName', '"Monstiez"'::jsonb),
  ('siteTagline', '""'::jsonb)
on conflict (key) do update set value = excluded.value;
