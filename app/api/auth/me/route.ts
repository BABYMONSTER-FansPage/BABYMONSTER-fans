import { NextResponse } from "next/server";
import { getSessionUser } from "../../_lib/database";
export async function GET(request: Request) {
  try { return NextResponse.json({ user: await getSessionUser(request) }); }
  catch { return NextResponse.json({ user: null }); }
}
