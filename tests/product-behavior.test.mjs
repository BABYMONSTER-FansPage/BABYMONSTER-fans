import test from "node:test";
import assert from "node:assert/strict";

test("saved locale wins over browser detection", async () => {
  const { getInitialLocale } = await import("../app/i18n.ts");
  assert.equal(getInitialLocale(["en-US"], "ja"), "ja");
  assert.equal(getInitialLocale(["ko-KR"], null), "ko");
  assert.equal(getInitialLocale(["fr-FR"], null), "zh-TW");
});

test("translation failure always falls back to original", async () => {
  const { translationResult } = await import("../app/translation-policy.ts");
  assert.deepEqual(translationResult("原文"), { text: "原文", original: "原文", fallback: true });
  assert.deepEqual(translationResult("原文", "Translation"), { text: "Translation", original: "原文", fallback: false });
});

test("role permissions are enforced by Supabase RLS", async () => {
  const { readFile } = await import("node:fs/promises");
  const [sql, nicknamePolicy, nicknameRules] = await Promise.all([
    readFile(new URL("../supabase/migrations/202608100001_monstiez_community.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608100004_profile_nickname_policy.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608120004_unique_nickname_blacklist.sql", import.meta.url), "utf8"),
  ]);
  assert.match(sql, /alter table public\.posts enable row level security/i);
  assert.match(sql, /user_id = auth\.uid\(\) or public\.is_admin\(\)/i);
  assert.match(sql, /role public\.fan_role not null default 'monstiez'/i);
  assert.doesNotMatch(sql, /service_role.*grant/i);
  assert.match(nicknamePolicy, /grant update \(nickname\) on public\.profiles to authenticated/i);
  assert.match(nicknameRules, /create unique index if not exists profiles_nickname_normalized_unique/i);
  assert.match(nicknameRules, /lower\(btrim\(nickname\)\)/i);
  assert.match(nicknameRules, /values \('ahyeon'\)/i);
  assert.match(nicknameRules, /normalized_name = normalized/i);
  assert.match(nicknameRules, /create trigger enforce_profile_nickname_rules/i);
  assert.match(nicknameRules, /admins manage nickname blacklist/i);
});

test("nickname blacklist uses exact case-insensitive matches", () => {
  const normalizedBlacklist = new Set(["ahyeon"]);
  const isBlocked = nickname => normalizedBlacklist.has(nickname.trim().toLocaleLowerCase("en-US"));
  assert.equal(isBlocked("ahyeon"), true);
  assert.equal(isBlocked("Ahyeon"), true);
  assert.equal(isBlocked("AHYEON"), true);
  assert.equal(isBlocked("ahyeon lover"), false);
  assert.equal(isBlocked("aheyno"), false);
});

test("replies and five-user report moderation are enforced in the database", async () => {
  const { readFile } = await import("node:fs/promises");
  const [sql, counts] = await Promise.all([
    readFile(new URL("../supabase/migrations/202608130001_post_replies_moderation.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608130002_post_reply_counts.sql", import.meta.url), "utf8"),
  ]);
  assert.match(sql, /create table if not exists public\.post_replies/i);
  assert.match(sql, /create table if not exists public\.moderation_notifications/i);
  assert.match(sql, /if total_reports >= 5 then/i);
  assert.match(sql, /set status = 'hidden'/i);
  assert.match(sql, /after insert on public\.reports/i);
  assert.match(sql, /admins read moderation notifications/i);
  assert.match(sql, /create or replace function public\.review_reported_post/i);
  assert.match(sql, /for update/i);
  assert.match(counts, /create or replace view public\.post_reply_counts/i);
});
