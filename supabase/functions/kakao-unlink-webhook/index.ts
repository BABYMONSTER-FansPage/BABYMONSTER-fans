import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedReferrers = new Set([
  "ACCOUNT_DELETE",
  "FORCED_ACCOUNT_DELETE",
  "UNLINK_FROM_APPS",
  "UNLINK_FROM_ADMIN",
  "INCOMPLETE_SIGN_UP",
  "REVOKE_ACCOUNT_SERVICE_TERMS",
  "UNLINK_FROM_SERVICE",
]);

function secureEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

async function requestPayload(request: Request) {
  const url = new URL(request.url);
  if (request.method === "GET") return Object.fromEntries(url.searchParams.entries());
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return await request.json() as Record<string, unknown>;
  return Object.fromEntries((await request.formData()).entries());
}

Deno.serve(async request => {
  if (request.method !== "GET" && request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const adminKey = Deno.env.get("KAKAO_ADMIN_KEY") || "";
  const expectedAppId = Deno.env.get("KAKAO_APP_ID") || "";
  if (!adminKey || !expectedAppId) return new Response("Webhook is not configured", { status: 503 });

  const authorization = request.headers.get("authorization") || "";
  if (!secureEqual(authorization, `KakaoAK ${adminKey}`)) return new Response("Unauthorized", { status: 401 });

  const payload = await requestPayload(request);
  const appId = String(payload.app_id || "");
  const userId = String(payload.user_id || "");
  const referrerType = String(payload.referrer_type || "");
  if (!secureEqual(appId, expectedAppId) || !userId || (referrerType && !allowedReferrers.has(referrerType))) {
    return new Response("Invalid payload", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const { error } = await supabase.from("oauth_unlink_events").insert({
    provider: "kakao",
    external_user_id: userId,
    app_id: appId,
    referrer_type: referrerType || null,
    payload,
  });
  if (error) return new Response("Temporary failure", { status: 500 });

  return new Response(null, { status: 200 });
});
