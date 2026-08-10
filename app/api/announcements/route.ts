import { NextResponse } from "next/server";
import { db, ensureDatabase } from "../_lib/database";

export async function GET(request: Request) {
  try {
    await ensureDatabase();
    const locale = new URL(request.url).searchParams.get("locale") || "zh-TW";
    const rows = await db().prepare(`SELECT id, title, body, published_at FROM announcements
      WHERE locale = ? AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
      AND (ends_at IS NULL OR ends_at > CURRENT_TIMESTAMP)
      ORDER BY pinned DESC, published_at DESC LIMIT 5`).bind(locale).all();
    return NextResponse.json({ announcements: rows.results });
  } catch { return NextResponse.json({ announcements: [] }); }
}
