import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("builds a GitHub Pages entry for babymonster.fans", async () => {
  const [html, cname, workflow, robots, sitemap] = await Promise.all([
    readFile(new URL("../dist-pages/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/CNAME", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8"),
    readFile(new URL("../dist-pages/robots.txt", import.meta.url), "utf8"),
    readFile(new URL("../dist-pages/sitemap.xml", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<title>Monstiez<\/title>/);
  assert.match(html, /<meta name="description" content="Monstiez 是提供 BABYMONSTER 粉絲交流、留言與內容瀏覽的非官方粉絲社群平台/);
  assert.match(html, /<meta property="og:title" content="Monstiez"/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /https:\/\/babymonster\.fans\/og\.png/);
  assert.equal(cname.trim(), "babymonster.fans");
  assert.match(robots, /Sitemap: https:\/\/babymonster\.fans\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/babymonster\.fans\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/babymonster\.fans\/#purpose<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/babymonster\.fans\/#members<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/babymonster\.fans\/#music<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/babymonster\.fans\/#events<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/babymonster\.fans\/#community<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/babymonster\.fans\/privacy\.html<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/babymonster\.fans\/terms\.html<\/loc>/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /VITE_SUPABASE_PUBLISHABLE_KEY/);
});

test("bundles six static languages and translates fan posts only", async () => {
  const [page, i18n, client, oauthRoute, css, envExample, migration, cmsMigration, albumMigration, relaxedMigration, spotifyFunction, translateFunction, privacy, terms] = await Promise.all([
    readFile(new URL("../app/FanPage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/i18n.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/supabase-browser.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/oauth/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608100001_monstiez_community.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608100003_inline_editing_content.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608100005_site_content_albums.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608110001_relax_site_content_keys.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/functions/spotify-releases/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/functions/translate-comment/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/privacy.html", import.meta.url), "utf8"),
    readFile(new URL("../public/terms.html", import.meta.url), "utf8"),
  ]);
  assert.match(i18n, /"zh-TW"/); assert.match(i18n, /"zh-CN"/);
  assert.match(i18n, /\bth:/); assert.match(i18n, /\ben:/); assert.match(i18n, /\bko:/); assert.match(i18n, /\bja:/);
  assert.match(page, /InlineEditContext/);
  assert.match(page, /customSections/);
  assert.match(page, /OFFICIAL_BRAND_NAME = "Monstiez"/);
  assert.match(page, /<h2 id="official-app-name"/);
  assert.match(page, /Official app name/);
  assert.match(page, /Monstiez 是提供 BABYMONSTER 粉絲交流、留言與內容瀏覽的粉絲社群平台/);
  assert.match(page, /使用者可以建立帳號、參與社群互動、管理個人資料/);
  assert.match(page, /Google 登入用於快速建立及登入 Monstiez 帳號/);
  assert.match(page, /不會要求 Gmail、Google Drive 或 Google Calendar 權限/);
  assert.match(page, /https:\/\/babymonster\.fans\/privacy\.html/);
  assert.match(page, /https:\/\/babymonster\.fans\/terms\.html/);
  assert.ok(page.indexOf("<AppPurposeSection />") > page.indexOf("<Announcements"));
  assert.ok(page.indexOf("<AppPurposeSection />") < page.indexOf("<Footer"));
  assert.match(page, /MON<span style=\{\{ color: "#E01020" \}\}>STIEZ<\/span>/);
  assert.match(page, /aria-label="Loading Monstiez fan site"/);
  assert.match(page, />\s*Monstiez\s*<\/motion\.h1>/);
  assert.doesNotMatch(page, /Loading BABYMONSTER fan site/);
  assert.doesNotMatch(page, /\{messages\[locale\]\.streamsLabel\}<\/div>/);
  assert.match(page, /fetchSpotifyReleaseStatus/);
  assert.match(page, /Spotify 專輯資料暫時沒有載入/);
  assert.match(page, /normalizeTrackNames/);
  assert.match(page, /顯示全部歌曲/);
  assert.doesNotMatch(page, /tracks\.length\s*\+\s*["'`]\s*tracks/i);
  assert.match(page, /AllPostsModal/);
  assert.match(page, /updateFanNickname/);
  assert.match(page, /useScroll/); assert.match(page, /useTransform/);
  assert.match(client, /translateFanPost/); assert.match(client, /functions\.invoke\("translate-comment"/);
  assert.doesNotMatch(client, /wechat/i);
  assert.match(oauthRoute, /scope: "openid email profile"/);
  assert.doesNotMatch(oauthRoute, /gmail|drive|calendar/i);
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
  assert.match(privacy, /<title>Monstiez 隱私權政策<\/title>/);
  assert.match(privacy, /Monstiez（網址：https:\/\/babymonster\.fans\/）/);
  assert.match(privacy, /Google 登入與 Google 使用者資料/);
  assert.match(privacy, /基本 Profile 與 Email 資訊/);
  assert.match(privacy, /不會要求、讀取或儲存你的 Gmail/);
  assert.match(terms, /<title>Monstiez 服務條款<\/title>/);
  assert.match(terms, /歡迎使用 Monstiez/);
});
