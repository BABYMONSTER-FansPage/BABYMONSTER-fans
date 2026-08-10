import { NextResponse } from "next/server";
import { db, ensureDatabase, getSessionUser } from "../_lib/database";

type PostRow = { id: number; nickname: string; body: string; likes: number; created_at: string };

export async function GET() {
  try {
    await ensureDatabase();
    const result = await db().prepare(`SELECT posts.id, users.nickname, posts.body, posts.created_at,
      (SELECT count(*) FROM likes WHERE likes.post_id = posts.id) AS likes
      FROM posts JOIN users ON users.id = posts.user_id ORDER BY posts.created_at DESC LIMIT 50`).all<PostRow>();
    return NextResponse.json({ posts: result.results.map(row => ({ id: row.id, nickname: row.nickname, body: row.body, likes: Number(row.likes), comments: 0, createdAt: new Date(row.created_at + "Z").toLocaleDateString("zh-TW") })) });
  } catch { return NextResponse.json({ posts: [] }); }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
    const { body } = await request.json() as { body?: string };
    const cleanBody = String(body || "").trim();
    if (cleanBody.length < 2 || cleanBody.length > 500) return NextResponse.json({ error: "留言需為 2–500 字。" }, { status: 400 });
    const result = await db().prepare("INSERT INTO posts(user_id, body) VALUES(?, ?)").bind(user.id, cleanBody).run();
    return NextResponse.json({ post: { id: Number(result.meta.last_row_id), nickname: user.nickname, body: cleanBody, likes: 0, comments: 0, createdAt: "剛剛" } }, { status: 201 });
  } catch { return NextResponse.json({ error: "目前無法發表留言。" }, { status: 500 }); }
}
