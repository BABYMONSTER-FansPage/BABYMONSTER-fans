insert into public.site_content (key, value)
values (
  'events',
  '[
    {"id":"choom-chiba-2026","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"CHIBA","startDate":"2026-08-11","endDate":"2026-08-12","dates":"2026.08.11–08.12","locations":"LALA ARENA TOKYO BAY","type":"World Tour","status":"past","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Chiba."},
    {"id":"choom-nagoya-2026","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"NAGOYA","startDate":"2026-08-16","dates":"2026.08.16","locations":"IG ARENA","type":"World Tour","status":"future","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Nagoya."},
    {"id":"choom-manila-2026","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"MANILA","startDate":"2026-09-05","dates":"2026.09.05","locations":"SM MALL OF ASIA ARENA","type":"World Tour","status":"future","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Manila."},
    {"id":"choom-macao-2026","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"MACAO","startDate":"2026-09-12","dates":"2026.09.12","locations":"THE EVENTTAINMENT ARENA","type":"World Tour","status":"future","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Macao."},
    {"id":"choom-osaka-2026","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"OSAKA","startDate":"2026-09-22","endDate":"2026-09-23","dates":"2026.09.22–09.23","locations":"KYOCERA DOME OSAKA","type":"World Tour","status":"future","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Osaka."},
    {"id":"choom-jakarta-2026","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"JAKARTA","startDate":"2026-10-17","dates":"2026.10.17","locations":"INDONESIA ARENA","type":"World Tour","status":"future","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Jakarta."},
    {"id":"choom-bangkok-2026","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"BANGKOK","startDate":"2026-11-07","endDate":"2026-11-08","dates":"2026.11.07–11.08","locations":"IMPACT ARENA","type":"World Tour","status":"future","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Bangkok."},
    {"id":"choom-kuala-lumpur-2026","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"KUALA LUMPUR","startDate":"2026-11-14","dates":"2026.11.14","locations":"UNIFI ARENA","type":"World Tour","status":"future","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Kuala Lumpur."},
    {"id":"choom-taipei-2026","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"TAIPEI","startDate":"2026-11-21","endDate":"2026-11-22","dates":"2026.11.21–11.22","locations":"TAIPEI ARENA","type":"World Tour","status":"future","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Taipei."},
    {"id":"choom-singapore-2026","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"SINGAPORE","startDate":"2026-11-28","dates":"2026.11.28","locations":"SINGAPORE INDOOR STADIUM","type":"World Tour","status":"future","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Singapore."},
    {"id":"choom-auckland-2026","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"AUCKLAND","startDate":"2026-12-08","dates":"2026.12.08","locations":"SPARK ARENA","type":"World Tour","status":"future","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Auckland."},
    {"id":"choom-melbourne-2026","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"MELBOURNE","startDate":"2026-12-11","dates":"2026.12.11","locations":"ROD LAVER ARENA","type":"World Tour","status":"future","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Melbourne."},
    {"id":"choom-sydney-2026","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"SYDNEY","startDate":"2026-12-13","dates":"2026.12.13","locations":"QUDOS BANK ARENA","type":"World Tour","status":"future","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Sydney."},
    {"id":"choom-hong-kong-2027","title":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR","sub":"HONG KONG","startDate":"2027-01-09","dates":"2027.01.09","locations":"ASIAWORLD-ARENA","type":"World Tour","status":"future","desc":"BABYMONSTER <CHOOM> 2026-27 WORLD TOUR in Hong Kong."}
  ]'::jsonb
)
on conflict (key) do update
set value = excluded.value,
    updated_at = timezone('utc'::text, now());
