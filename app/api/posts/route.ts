import { NextResponse } from "next/server";
import { db, ensureDatabase, getSessionUser } from "../_lib/database";

type PostRow = { id: number; user_id: number; nickname: string; role: "monstiez" | "admin" | "artist"; body: string; source_language: string; status: string; likes: number; created_at: string; updated_at: string | null };

export async function GET(request: Request) {
  try {
    await ensureDatabase();
    const viewer = await getSessionUser(request);
    const result = await db().prepare(`SELECT posts.id, posts.user_id, users.nickname, users.role, posts.body,
      posts.source_language, posts.status, posts.created_at, posts.updated_at,
      (SELECT count(*) FROM likes WHERE likes.post_id = posts.id) AS likes
      FROM posts JOIN users ON users.id = posts.user_id
      WHERE posts.status = 'published' OR ? = 'admin'
      ORDER BY posts.created_at DESC LIMIT 50`).bind(viewer?.role || "monstiez").all<PostRow>();
    return NextResponse.json({ posts: result.results.map(row => ({
      id: row.id, userId: row.user_id, nickname: row.nickname, role: row.role, body: row.body,
      sourceLanguage: row.source_language, status: row.status, likes: Number(row.likes), comments: 0,
      canEdit: Boolean(viewer && (viewer.id === row.user_id || viewer.role === "admin")),
      createdAt: new Date(row.created_at + "Z").toLocaleDateString("en-CA"), updatedAt: row.updated_at,
    })) });
  } catch { return NextResponse.json({ posts: [] }); }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
    const { body, sourceLanguage } = await request.json() as { body?: string; sourceLanguage?: string };
    const cleanBody = String(body || "").trim();
    if (cleanBody.length < 2 || cleanBody.length > 500) return NextResponse.json({ error: "留言需為 2–500 字。" }, { status: 400 });
    const language = ["zh-TW","zh-CN","th","en","ko","ja"].includes(String(sourceLanguage)) ? sourceLanguage : "zh-TW";
    const result = await db().prepare("INSERT INTO posts(user_id, body, source_language) VALUES(?, ?, ?)").bind(user.id, cleanBody, language).run();
    return NextResponse.json({ post: { id: Number(result.meta.last_row_id), userId: user.id, nickname: user.nickname, role: user.role, body: cleanBody, sourceLanguage: language, status: "published", likes: 0, comments: 0, canEdit: true, createdAt: new Date().toLocaleDateString("en-CA") } }, { status: 201 });
  } catch { return NextResponse.json({ error: "目前無法發表留言。" }, { status: 500 }); }
}
