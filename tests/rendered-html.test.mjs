import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("builds a GitHub Pages entry for babymonster.fans", async () => {
  const [html, cname, workflow] = await Promise.all([
    readFile(new URL("../dist-pages/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/CNAME", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<title>MONSTIEZ GLOBAL/);
  assert.match(html, /https:\/\/babymonster\.fans\/og\.png/);
  assert.equal(cname.trim(), "babymonster.fans");
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /VITE_SUPABASE_PUBLISHABLE_KEY/);
});

test("bundles six static languages and translates fan posts only", async () => {
  const [page, i18n, client, css, envExample, migration, cmsMigration] = await Promise.all([
    readFile(new URL("../app/FanPage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/i18n.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/supabase-browser.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608100001_monstiez_community.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608100003_inline_editing_content.sql", import.meta.url), "utf8"),
  ]);
  assert.match(i18n, /"zh-TW"/); assert.match(i18n, /"zh-CN"/);
  assert.match(i18n, /\bth:/); assert.match(i18n, /\ben:/); assert.match(i18n, /\bko:/); assert.match(i18n, /\bja:/);
  assert.match(page, /InlineEditContext/);
  assert.match(page, /customSections/);
  assert.match(page, /fetchSpotifyReleases/);
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
});
