import { NextResponse } from "next/server";
import { createSession, db, ensureDatabase, hashPassword, sessionCookie } from "../../_lib/database";

export async function POST(request: Request) {
  try {
    const { email, nickname, password } = await request.json() as Record<string, string>;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanNickname = String(nickname || "").trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanNickname.length < 2 || cleanNickname.length > 24 || String(password || "").length < 10) return NextResponse.json({ error: "請填寫有效信箱、2–24 字暱稱與至少 10 字元密碼。" }, { status: 400 });
    await ensureDatabase();
    const passwordData = await hashPassword(password);
    const result = await db().prepare("INSERT INTO users(email, nickname, password_hash, password_salt, provider) VALUES(?, ?, ?, ?, 'email')").bind(cleanEmail, cleanNickname, passwordData.hash, passwordData.salt).run();
    const user = { id: Number(result.meta.last_row_id), nickname: cleanNickname, email: cleanEmail, role: "monstiez" as const };
    const response = NextResponse.json({ user }, { status: 201 });
    response.headers.set("set-cookie", sessionCookie(await createSession(user.id), request));
    return response;
  } catch (error) {
    const message = String(error);
    if (message.includes("UNIQUE")) return NextResponse.json({ error: "這個電子郵件已註冊。" }, { status: 409 });
    return NextResponse.json({ error: "暫時無法建立帳號。" }, { status: 500 });
  }
}
