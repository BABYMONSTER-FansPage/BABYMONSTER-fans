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
  assert.match(html, /<title>Monstiez｜BABYMONSTER Fan Community<\/title>/);
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
  const [page, i18n, client, oauthRoute, css, envExample, migration, cmsMigration, albumMigration, relaxedMigration, instagramMigration, tourMigration, spotifyFunction, translateFunction, privacy, terms] = await Promise.all([
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
    readFile(new URL("../supabase/migrations/202608120001_instagram_posts_content.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608120002_choom_tour_after_chiba.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/functions/spotify-releases/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/functions/translate-comment/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/privacy.html", import.meta.url), "utf8"),
    readFile(new URL("../public/terms.html", import.meta.url), "utf8"),
  ]);
  assert.match(i18n, /"zh-TW"/); assert.match(i18n, /"zh-CN"/);
  assert.match(i18n, /\bth:/); assert.match(i18n, /\ben:/); assert.match(i18n, /\bko:/); assert.match(i18n, /\bja:/);
  assert.match(page, /InlineEditContext/);
  assert.match(page, /customSections/);
  assert.match(client, /instagramPosts\?: Record<string, string\[\]>/);
  assert.doesNotMatch(page, /function InstagramSignalSection/);
  assert.doesNotMatch(page, /<InstagramSignalSection/);
  assert.match(page, /normalizeMemberInstagramPosts/);
  assert.match(page, /instagramPosts=\{memberInstagramPosts\[m\.id\]\}/);
  assert.match(page, /instagramEmbedUrl/);
  assert.match(page, /return `\$\{url\}embed\/`/);
  assert.match(page, /<iframe/);
  assert.match(page, /normalizeInstagramUrl/);
  assert.match(page, /raw\.match\(/);
  assert.match(page, /embeddedUrl/);
  assert.match(page, /referrerPolicy="strict-origin-when-cross-origin"/);
  assert.match(page, /h-\[560px\]/);
  assert.match(page, /loading="lazy"/);
  assert.doesNotMatch(page, /instagram\.com\/embed\.js/);
  assert.doesNotMatch(page, /data-instgrm-permalink/);
  assert.match(page, /normalizeInstagramPosts/);
  assert.match(page, /成員 Instagram 貼文/);
  assert.match(page, /key=\{event\.id \?\? index\}/);
  assert.match(page, /visibleEvents/);
  assert.match(page, /classifyEventsByDate/);
  assert.match(page, /eventDateTimestamp/);
  assert.match(page, /EventDetailModal/);
  assert.match(page, /AllEventsModal/);
  assert.match(page, /查看全部活動/);
  assert.match(page, /type="date"/);
  assert.match(page, /開始日期/);
  assert.match(page, /結束日期/);
  assert.match(page, /eventDisplayDate/);
  assert.doesNotMatch(page, /顯示日期文字/);
  assert.match(page, /自動狀態/);
  assert.doesNotMatch(page, /value="ongoing">進行中/);
  assert.match(page, /儲存 Instagram/);
  assert.match(page, /saveInstagramPostsOnly/);
  assert.match(page, /saveSiteContent\(\{ instagramPosts: posts \}\)/);
  assert.match(page, /OFFICIAL_BRAND_NAME = "Monstiez"/);
  assert.match(client, /verifyEmailOtp/);
  assert.match(client, /type: "signup"/);
  assert.match(client, /resetPasswordForEmail/);
  assert.match(client, /verifyPasswordRecoveryOtp/);
  assert.match(client, /type: "recovery"/);
  assert.doesNotMatch(client, /emailRedirectTo|redirectTo:.*reset-password/);
  assert.match(client, /updateUser\(\{ password \}\)/);
  assert.match(page, /ResetPasswordModal/);
  assert.match(page, /function OtpCodeInput/);
  assert.match(page, /autoComplete="one-time-code"/);
  assert.match(page, /inputMode="numeric"/);
  assert.match(page, /type="tel"/);
  assert.match(page, /name="otp"/);
  assert.match(page, /grid-cols-6/);
  assert.match(page, /value\.slice\(0, -1\)/);
  assert.match(page, /忘記密碼/);
  assert.match(page, /needsEmailConfirmation/);
  assert.match(page, /SITE_CONTENT_CACHE_KEY/);
  assert.match(page, /setTimeout\(\(\) => \{ if \(active\) setBooting\(false\); \}, 420\)/);
  assert.match(client, /withTimeout/);
  assert.doesNotMatch(css, /content-visibility: auto/);
  assert.match(page, /<AnimatePresence>\{booting && <OpeningLoader/);
  assert.match(page, /aria-controls="mobile-navigation"/);
  assert.match(page, /scrollIntoView\(\{ behavior: mobile \? "auto" : "smooth"/);
  assert.match(page, /disableCinematicMotion/);
  assert.match(page, /function VerificationBadge/);
  assert.match(page, /verification-badge/);
  assert.match(css, /\.verification-badge \{ position: absolute; right: -4px; bottom: -4px/);
  assert.doesNotMatch(page, /\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Presentation}/u);
  assert.match(tourMigration, /choom-hong-kong-2027/);
  assert.match(page, /SITE_BROWSER_TITLE = "Monstiez｜BABYMONSTER Fan Community"/);
  assert.match(page, /FIXED_FAVICON_URL = "\/favicon\.svg"/);
  assert.match(page, /Monstiez（固定）/);
  assert.match(page, /\/favicon\.svg（固定）/);
  assert.doesNotMatch(page, /update\("siteName"/);
  assert.doesNotMatch(page, /update\("faviconUrl"/);
  assert.match(page, /<h2 id="official-app-name"/);
  assert.match(i18n, /fixedMessages/);
  assert.match(i18n, /detailIntro/);
  assert.match(i18n, /Detailed intro/);
  assert.match(i18n, /詳しい紹介/);
  assert.match(i18n, /What is Monstiez\?/);
  assert.match(i18n, /MONSTIEZ 是 BABYMONSTER 的官方粉絲名/);
  assert.match(i18n, /使用者登入後可以參與社群互動/);
  assert.match(i18n, /BABYMONSTER\.fans 為非官方粉絲專頁/);
  assert.match(i18n, /BABYMONSTER\.fans is an unofficial fan page/);
  assert.match(i18n, /support@babymonster\.fans/);
  assert.match(i18n, /僅會使用你的暱稱、頭像及電子郵件地址/);
  assert.match(i18n, /Google 로그인 시에는 표시 이름, 프로필 사진 및 이메일 주소만 사용합니다/);
  assert.match(i18n, /Googleログインでは、表示名、プロフィール画像、メールアドレスのみを使用します/);
  assert.match(page, /k="footerLegalNoticeV3" fallback=\{t\.warning\}/);
  assert.doesNotMatch(i18n, /使用者可以建立帳號、參與社群互動/);
  assert.match(i18n, /Monstiez 是提供 BABYMONSTER 粉絲交流、留言與內容瀏覽的粉絲社群平台/);
  assert.doesNotMatch(i18n, /Google 登入用於快速建立及登入 Monstiez 帳號/);
  assert.doesNotMatch(i18n, /Google 登入只用於|Gmail、Google Drive 或 Google Calendar/);
  assert.match(page, /https:\/\/babymonster\.fans\/privacy\.html/);
  assert.match(page, /https:\/\/babymonster\.fans\/terms\.html/);
  assert.ok(page.indexOf("<AppPurposeSection locale={locale} />") > page.indexOf("<Announcements"));
  assert.ok(page.indexOf("<AppPurposeSection locale={locale} />") < page.indexOf("<Footer"));
  assert.match(page, /MON<span style=\{\{ color: "#E01020" \}\}>STIEZ<\/span>/);
  assert.match(page, /&copy; 2026 \{OFFICIAL_BRAND_NAME\}/);
  assert.match(page, /aria-label="Loading Monstiez fan site"/);
  assert.match(page, />\s*Monstiez\s*<\/h1>/);
  assert.doesNotMatch(page, /Loading BABYMONSTER fan site/);
  assert.doesNotMatch(page, /\{messages\[locale\]\.streamsLabel\}<\/div>/);
  assert.match(page, /fetchSpotifyReleaseStatus/);
  assert.match(page, /自動同步最新作品/);
  assert.match(page, /value\.split\(\/\\r\?\\n\//);
  assert.match(i18n, /Spotify 專輯資料暫時沒有載入/);
  assert.match(page, /normalizeTrackNames/);
  assert.match(i18n, /顯示全部歌曲/);
  assert.match(page, /TextEditModal/);
  assert.match(page, /localizedTextKey/);
  assert.match(page, /supportedLocales\.map/);
  assert.match(page, /openTextEditor/);
  assert.doesNotMatch(page, /window\.prompt\("編輯文字"/);
  assert.doesNotMatch(page, /useAmbientMusic/);
  assert.doesNotMatch(page, /AudioContext/);
  assert.doesNotMatch(page, /AudioPlayerBar/);
  assert.doesNotMatch(i18n, /soundOn|soundOff|soundBlocked/);
  assert.doesNotMatch(page, /tracks\.length\s*\+\s*["'`]\s*tracks/i);
  assert.match(page, /AllPostsModal/);
  assert.match(page, /updateFanNickname/);
  assert.match(client, /nickname_availability/);
  assert.match(client, /listNicknameBlacklist/);
  assert.match(page, /暱稱黑名單/);
  assert.match(page, /ahyeon lover/);
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
  assert.match(instagramMigration, /'instagramPosts'/);
  assert.match(instagramMigration, /DbsLtoLmfWh/);
  assert.match(instagramMigration, /public\.site_content\.value = '\[\]'::jsonb/);
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

test("offers Google as the only social login", async () => {
  const [page, client, oauthRoute, oauthCallback] = await Promise.all([
    readFile(new URL("../app/FanPage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/supabase-browser.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/oauth/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/oauth/callback/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /oauth\("google"\)/);
  assert.match(client, /provider: "google"/);
  assert.doesNotMatch(page, /KakaoTalk|oauth\("kakao"\)/);
  assert.doesNotMatch(oauthRoute, /kakao|wechat/i);
  assert.doesNotMatch(oauthCallback, /kakao|wechat/i);
});

test("auth delivery notices cover six languages and emails use six-digit codes", async () => {
  const [page, confirmation, recovery, magicLink, passwordChanged, config] = await Promise.all([
    readFile(new URL("../app/FanPage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../supabase/templates/confirmation.html", import.meta.url), "utf8"),
    readFile(new URL("../supabase/templates/recovery.html", import.meta.url), "utf8"),
    readFile(new URL("../supabase/templates/magic_link.html", import.meta.url), "utf8"),
    readFile(new URL("../supabase/templates/password_changed_notification.html", import.meta.url), "utf8"),
    readFile(new URL("../supabase/config.toml", import.meta.url), "utf8"),
  ]);
  for (const notice of ["垃圾郵件匣", "垃圾邮件文件夹", "สแปม", "spam or junk folder", "스팸 메일함", "迷惑メールフォルダ"]) {
    assert.match(page, new RegExp(notice));
  }
  for (const template of [confirmation, recovery, magicLink, passwordChanged]) {
    assert.match(template, /<html lang="en">/);
    assert.match(template, /support@babymonster\.fans/);
    assert.match(template, /https:\/\/babymonster\.fans\/favicon\.svg/);
    assert.match(template, /color-scheme" content="light dark"/);
    assert.match(template, /background:\s*Canvas\s*!important/i);
    assert.match(template, /color:\s*CanvasText\s*!important/i);
    assert.match(template, /color:\s*GrayText\s*!important/i);
    assert.match(template, /\.brand-header\s*\{\s*background:\s*#d84f7d\s*!important/i);
    assert.match(template, /\.brand-header \.mail-title\s*\{\s*color:\s*#(?:fff|ffffff)\s*!important/i);
    assert.doesNotMatch(template, /prefers-color-scheme/);
    assert.doesNotMatch(template, /\[data-ogs[bc]\]/);
    assert.doesNotMatch(template, /#9185f7|#a99fff|#b8afff/i);
    assert.doesNotMatch(template, /lang="(?:zh-Hans|th|ko|ja)"/);
  }
  assert.match(confirmation, /Confirm your email address/);
  assert.match(recovery, /Reset your password/);
  assert.match(magicLink, /Your sign-in code/);
  assert.match(magicLink, /OTP code/);
  assert.match(passwordChanged, /Your password was changed/);
  assert.match(config, /otp_length = 6/);
  for (const template of [confirmation, recovery, magicLink]) {
    assert.match(template, /\{\{ \.Token \}\}/);
    assert.doesNotMatch(template, /ConfirmationURL|href="\{\{/);
  }
});
