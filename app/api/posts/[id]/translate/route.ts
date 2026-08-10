import { NextResponse } from "next/server";
import { db, ensureDatabase } from "../../../_lib/database";
import { translateText } from "../../../_lib/translation";
import { translationResult } from "../../../../translation-policy";

type PostText = { body: string; source_language: string };

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const target = new URL(request.url).searchParams.get("target") || "en";
  if (!["zh-TW","zh-CN","th","en","ko","ja"].includes(target)) return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  try {
    await ensureDatabase();
    const post = await db().prepare("SELECT body, source_language FROM posts WHERE id = ? AND status = 'published'").bind(Number(id)).first<PostText>();
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (post.source_language === target) return NextResponse.json({ text: post.body, original: post.body, fallback: false });
    const cached = await db().prepare("SELECT translated_body FROM post_translations WHERE post_id = ? AND target_language = ?").bind(Number(id), target).first<{ translated_body: string }>();
    if (cached) return NextResponse.json({ text: cached.translated_body, original: post.body, fallback: false, cached: true });
    try {
      const translated = await translateText(post.body, post.source_language, target);
      await db().prepare("INSERT OR REPLACE INTO post_translations(post_id, target_language, translated_body, provider) VALUES(?, ?, ?, 'libretranslate')").bind(Number(id), target, translated).run();
      return NextResponse.json(translationResult(post.body, translated));
    } catch {
      return NextResponse.json(translationResult(post.body));
    }
  } catch { return NextResponse.json({ error: "Unable to translate" }, { status: 500 }); }
}
