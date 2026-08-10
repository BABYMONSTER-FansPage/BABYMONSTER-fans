import { NextResponse } from "next/server";
import { clearSessionCookie, deleteSession } from "../../_lib/database";
export async function POST(request: Request) {
  try { await deleteSession(request); } catch { /* Cookie is cleared even if the stored session is already gone. */ }
  const response = NextResponse.json({ ok: true });
  response.headers.set("set-cookie", clearSessionCookie());
  return response;
}
