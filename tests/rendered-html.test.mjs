import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("builds a GitHub Pages entry for babymonster.fans", async () => {
  const [html, cname, workflow] = await Promise.all([
    readFile(new URL("../dist-pages/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/CNAME", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<title>Monstiez<\/title>/);
  assert.match(html, /https:\/\/babymonster\.fans\/og\.png/);
  assert.equal(cname.trim(), "babymonster.fans");
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /VITE_SUPABASE_PUBLISHABLE_KEY/);
});

test("bundles six static languages and translates fan posts only", async () => {
  const [page, i18n, client, css, envExample, migration, cmsMigration, albumMigration, relaxedMigration, spotifyFunction, translateFunction, privacy] = await Promise.all([
    readFile(new URL("../app/FanPage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/i18n.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/supabase-browser.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608100001_monstiez_community.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608100003_inline_editing_content.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608100005_site_content_albums.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608110001_relax_site_content_keys.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/functions/spotify-releases/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/functions/translate-comment/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/privacy.html", import.meta.url), "utf8"),
  ]);
  assert.match(i18n, /"zh-TW"/); assert.match(i18n, /"zh-CN"/);
  assert.match(i18n, /\bth:/); assert.match(i18n, /\ben:/); assert.match(i18n, /\bko:/); assert.match(i18n, /\bja:/);
  assert.match(page, /InlineEditContext/);
  assert.match(page, /customSections/);
  assert.match(page, /APP PURPOSE/);
  assert.match(page, /Google 登入僅用於建立與辨識你的粉絲帳號/);
  assert.match(page, /fetchSpotifyReleaseStatus/);
  assert.match(page, /Spotify 專輯資料暫時沒有載入/);
  assert.match(page, /AllPostsModal/);
  assert.match(page, /updateFanNickname/);
  assert.match(page, /useScroll/); assert.match(page, /useTransform/);
  assert.match(client, /translateFanPost/); assert.match(client, /functions\.invoke\("translate-comment"/);
  assert.doesNotMatch(client, /wechat/i);
  assert.match(css, /max-width: 767px/); assert.match(page, /safe-area-inset-bottom/);
  assert.match(envExample, /VITE_SUPABASE_PUBLISHABLE_KEY=/);
  assert.match(migration, /enable row level security/);
  assert.match(cmsMigration, /uiText/);
  assert.match(cmsMigration, /customSections/);
  assert.match(albumMigration, /'albums'/);
  assert.match(relaxedMigration, /drop constraint if exists site_content_key_check/);
  assert.match(spotifyFunction, /x-client-info/);
  assert.match(spotifyFunction, /access-control-allow-methods/);
  assert.match(spotifyFunction, /\/albums\/\$\{item\.id\}\?market=US/);
  assert.match(spotifyFunction, /trackNames/);
  assert.doesNotMatch(spotifyFunction, /\$\{item\.total_tracks\} tracks/);
  assert.match(translateFunction, /x-client-info/);
  assert.match(privacy, /Google 登入與 Google 使用者資料/);
  assert.match(privacy, /不會要求、讀取或儲存你的 Gmail/);
});
