import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { createSession, findOrCreateOAuthUser, sessionCookie } from "../../../_lib/database";

type Provider = "google" | "kakao" | "wechat";

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
  if (provider === "kakao") {
    const token = await fetch("https://kauth.kakao.com/oauth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", client_id: runtime.KAKAO_CLIENT_ID!, client_secret: runtime.KAKAO_CLIENT_SECRET || "", redirect_uri: redirectUri, code }) }).then(r => r.json()) as { access_token?: string };
    const profile = await fetch("https://kapi.kakao.com/v2/user/me", { headers: { authorization: `Bearer ${token.access_token}` } }).then(r => r.json()) as { id: number; kakao_account?: { email?: string; profile?: { nickname?: string } } };
    return { id: String(profile.id), email: profile.kakao_account?.email || null, nickname: profile.kakao_account?.profile?.nickname || "Kakao MONSTIEZ" };
  }
  const tokenUrl = new URL("https://api.weixin.qq.com/sns/oauth2/access_token");
  tokenUrl.search = new URLSearchParams({ appid: runtime.WECHAT_CLIENT_ID!, secret: runtime.WECHAT_CLIENT_SECRET!, code, grant_type: "authorization_code" }).toString();
  const token = await fetch(tokenUrl).then(r => r.json()) as { access_token: string; openid: string };
  const profileUrl = new URL("https://api.weixin.qq.com/sns/userinfo");
  profileUrl.search = new URLSearchParams({ access_token: token.access_token, openid: token.openid, lang: "zh_TW" }).toString();
  const profile = await fetch(profileUrl).then(r => r.json()) as { openid: string; nickname?: string };
  return { id: profile.openid, email: null, nickname: profile.nickname || "WeChat MONSTIEZ" };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") as Provider;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || !["google", "kakao", "wechat"].includes(provider) || readCookie(request, "monstiez_oauth") !== `${provider}.${state}`) return NextResponse.redirect(new URL("/?auth=invalid", url.origin));
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
