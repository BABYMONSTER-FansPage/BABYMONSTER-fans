import { NextResponse } from "next/server";
import { db, ensureDatabase, getSessionUser } from "../../../_lib/database";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureDatabase();
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = Number((await context.params).id);
    const { reason } = await request.json().catch(() => ({ reason: "community-report" })) as { reason?: string };
    await db().prepare("INSERT OR IGNORE INTO reports(post_id, reporter_id, reason) VALUES(?, ?, ?)").bind(id, user.id, String(reason || "community-report").slice(0, 240)).run();
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to report" }, { status: 500 }); }
}
