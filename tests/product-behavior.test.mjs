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
  const [sql, nicknamePolicy] = await Promise.all([
    readFile(new URL("../supabase/migrations/202608100001_monstiez_community.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/202608100004_profile_nickname_policy.sql", import.meta.url), "utf8"),
  ]);
  assert.match(sql, /alter table public\.posts enable row level security/i);
  assert.match(sql, /user_id = auth\.uid\(\) or public\.is_admin\(\)/i);
  assert.match(sql, /role public\.fan_role not null default 'monstiez'/i);
  assert.doesNotMatch(sql, /service_role.*grant/i);
  assert.match(nicknamePolicy, /grant update \(nickname\) on public\.profiles to authenticated/i);
});
