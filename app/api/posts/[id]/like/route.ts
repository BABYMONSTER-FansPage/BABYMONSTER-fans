import { NextResponse } from "next/server";
import { db, getSessionUser } from "../../../_lib/database";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
    const { id } = await context.params;
    const postId = Number(id);
    if (!Number.isInteger(postId)) return NextResponse.json({ error: "留言不存在。" }, { status: 404 });
    const existing = await db().prepare("SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?").bind(postId, user.id).first();
    if (existing) await db().prepare("DELETE FROM likes WHERE post_id = ? AND user_id = ?").bind(postId, user.id).run();
    else await db().prepare("INSERT INTO likes(post_id, user_id) VALUES(?, ?)").bind(postId, user.id).run();
    const count = await db().prepare("SELECT count(*) AS total FROM likes WHERE post_id = ?").bind(postId).first<{ total: number }>();
    return NextResponse.json({ liked: !existing, likes: Number(count?.total || 0) });
  } catch { return NextResponse.json({ error: "目前無法按讚。" }, { status: 500 }); }
}
