import { NextResponse } from "next/server";
import { db, ensureDatabase, getSessionUser } from "../../_lib/database";
import { canDeletePost, canEditPost, canModerate } from "../../_lib/permissions";

async function postOwner(id: number) {
  return db().prepare("SELECT user_id, status FROM posts WHERE id = ?").bind(id).first<{ user_id: number; status: string }>();
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureDatabase();
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = Number((await context.params).id);
    const post = await postOwner(id);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const payload = await request.json() as { body?: string; status?: "published" | "hidden" | "pending" };
    if (payload.status) {
      if (!canModerate(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      await db().prepare("UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(payload.status, id).run();
      return NextResponse.json({ ok: true, status: payload.status });
    }
    if (!canEditPost(user, post.user_id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = String(payload.body || "").trim();
    if (body.length < 2 || body.length > 500) return NextResponse.json({ error: "Body must be 2–500 characters" }, { status: 400 });
    await db().batch([
      db().prepare("UPDATE posts SET body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body, id),
      db().prepare("DELETE FROM post_translations WHERE post_id = ?").bind(id),
    ]);
    return NextResponse.json({ ok: true, body });
  } catch { return NextResponse.json({ error: "Unable to update" }, { status: 500 }); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureDatabase();
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = Number((await context.params).id);
    const post = await postOwner(id);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canDeletePost(user, post.user_id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await db().prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to delete" }, { status: 500 }); }
}
