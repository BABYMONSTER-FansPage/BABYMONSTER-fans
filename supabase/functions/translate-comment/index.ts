import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowed = new Set(["zh-TW", "zh-CN", "th", "en", "ko", "ja"]);
const languageMap: Record<string, string> = { "zh-TW": "zt", "zh-CN": "zh", th: "th", en: "en", ko: "ko", ja: "ja" };

Deno.serve(async request => {
  const requestOrigin = request.headers.get("origin") || "";
  const corsOrigin = requestOrigin === "https://babymonster.fans" || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(requestOrigin) ? requestOrigin : "https://babymonster.fans";
  const cors = { "access-control-allow-origin": corsOrigin, "vary": "origin", "access-control-allow-headers": "authorization, apikey, content-type" };
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { postId, target } = await request.json();
    if (!Number.isInteger(postId) || !allowed.has(target)) return Response.json({ error: "invalid request" }, { status: 400, headers: cors });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: post } = await supabase.from("posts").select("body,source_language,status").eq("id", postId).eq("status", "published").single();
    if (!post) return Response.json({ error: "not found" }, { status: 404, headers: cors });
    if (post.source_language === target) return Response.json({ text: post.body, original: post.body }, { headers: cors });
    const { data: cached } = await supabase.from("post_translations").select("translated_body").eq("post_id", postId).eq("target_language", target).maybeSingle();
    if (cached) return Response.json({ text: cached.translated_body, original: post.body, cached: true }, { headers: cors });
    const endpoint = Deno.env.get("TRANSLATION_API_URL");
    if (!endpoint) return Response.json({ text: post.body, original: post.body, fallback: true }, { headers: cors });
    const translatedResponse = await fetch(`${endpoint.replace(/\/$/, "")}/translate`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ q: post.body, source: languageMap[post.source_language] || "en", target: languageMap[target] || "en", format: "text", api_key: Deno.env.get("TRANSLATION_API_KEY") || undefined }),
    });
    const translated = await translatedResponse.json();
    if (!translatedResponse.ok || !translated.translatedText) return Response.json({ text: post.body, original: post.body, fallback: true }, { headers: cors });
    await supabase.from("post_translations").upsert({ post_id: postId, target_language: target, translated_body: translated.translatedText, provider: "libretranslate" });
    return Response.json({ text: translated.translatedText, original: post.body }, { headers: cors });
  } catch {
    return Response.json({ error: "translation unavailable" }, { status: 500, headers: cors });
  }
});
