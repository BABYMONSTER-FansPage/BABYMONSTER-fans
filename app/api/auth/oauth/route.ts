import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";

type Provider = "google";
const names: Record<Provider, { id: string; authorize: string; scope: string }> = {
  google: { id: "GOOGLE_CLIENT_ID", authorize: "https://accounts.google.com/o/oauth2/v2/auth", scope: "openid email profile" },
};

function randomState() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") as Provider;
  const config = names[provider];
  if (!config) return NextResponse.json({ error: "不支援的登入服務。" }, { status: 400 });
  const runtime = env as unknown as Record<string, string | undefined>;
  const clientId = runtime[config.id];
  if (!clientId) return new NextResponse(`尚未設定 ${provider} 登入金鑰。請由站長在部署環境設定 ${config.id}。`, { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  const state = randomState();
  const callback = `${url.origin}/api/auth/oauth/callback?provider=${provider}`;
  const target = new URL(config.authorize);
  target.search = new URLSearchParams({ client_id: clientId, redirect_uri: callback, response_type: "code", scope: config.scope, state }).toString();
  const response = NextResponse.redirect(target);
  response.headers.set("set-cookie", `monstiez_oauth=${provider}.${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${url.protocol === "https:" ? "; Secure" : ""}`);
  return response;
}
