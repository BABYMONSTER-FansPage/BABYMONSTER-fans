import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { createSession, findOrCreateOAuthUser, sessionCookie } from "../../../_lib/database";

type Provider = "google";

function readCookie(request: Request, name: string) {
  const pair = (request.headers.get("cookie") || "").split(";").map(v => v.trim()).find(v => v.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
}

async function exchange(provider: Provider, code: string, redirectUri: string) {
  const runtime = env as unknown as Record<string, string | undefined>;
  if (provider === "google") {
    const token = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: runtime.GOOGLE_CLIENT_ID!, client_secret: runtime.GOOGLE_CLIENT_SECRET!, redirect_uri: redirectUri, grant_type: "authorization_code" }) }).then(r => r.json()) as { access_token?: string };
    const profile = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${token.access_token}` } }).then(r => r.json()) as { sub: string; email?: string; name?: string };
    return { id: profile.sub, email: profile.email || null, nickname: profile.name || "Google MONSTIEZ" };
  }
  throw new Error("Provider is not supported");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") as Provider;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || provider !== "google" || readCookie(request, "monstiez_oauth") !== `${provider}.${state}`) return NextResponse.redirect(new URL("/?auth=invalid", url.origin));
  try {
    const redirectUri = `${url.origin}/api/auth/oauth/callback?provider=${provider}`;
    const profile = await exchange(provider, code, redirectUri);
    if (!profile.id) throw new Error("PROFILE_MISSING");
    const user = await findOrCreateOAuthUser(provider, profile.id, profile.email, profile.nickname);
    const response = NextResponse.redirect(new URL("/#community", url.origin));
    response.headers.append("set-cookie", sessionCookie(await createSession(user.id), request));
    response.headers.append("set-cookie", "monstiez_oauth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    return response;
  } catch { return NextResponse.redirect(new URL("/?auth=failed", url.origin)); }
}
