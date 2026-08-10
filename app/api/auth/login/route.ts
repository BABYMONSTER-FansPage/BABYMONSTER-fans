import { NextResponse } from "next/server";
import { createSession, db, ensureDatabase, sessionCookie, verifyPassword } from "../../_lib/database";

type UserRow = { id: number; nickname: string; email: string; password_hash: string | null; password_salt: string | null };

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json() as Record<string, string>;
    await ensureDatabase();
    const row = await db().prepare("SELECT id, nickname, email, password_hash, password_salt FROM users WHERE email = ?").bind(String(email || "").trim().toLowerCase()).first<UserRow>();
    if (!row?.password_hash || !row.password_salt || !await verifyPassword(String(password || ""), row.password_hash, row.password_salt)) return NextResponse.json({ error: "電子郵件或密碼不正確。" }, { status: 401 });
    const user = { id: row.id, nickname: row.nickname, email: row.email };
    const response = NextResponse.json({ user });
    response.headers.set("set-cookie", sessionCookie(await createSession(user.id), request));
    return response;
  } catch { return NextResponse.json({ error: "暫時無法登入。" }, { status: 500 }); }
}
