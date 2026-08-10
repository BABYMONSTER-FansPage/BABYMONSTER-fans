alter table public.site_content drop constraint if exists site_content_key_check;

alter table public.site_content add constraint site_content_key_check check (key in (
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
  'albums',
  'terms',
  'privacy',
  'uiText',
  'customSections'
));
