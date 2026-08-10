import { createClient, type Provider, type SupabaseClient, type User as AuthUser } from "@supabase/supabase-js";

export type FanRole = "monstiez" | "admin" | "artist";
export type FanUser = { id: string; nickname: string; email?: string; role: FanRole };
export type FanPost = {
  id: number; userId: string; nickname: string; role: FanRole; body: string; sourceLanguage: string;
  likes: number; comments: number; liked: boolean; canEdit: boolean; createdAt: string;
};
export type EditableEvent = {
  title: string; sub: string; dates: string; locations: string; type: string;
  status: "upcoming" | "past"; desc: string;
};
export type SiteContent = {
  siteName?: string;
  siteTagline?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  heroKicker?: string;
  heroNote?: string;
  heroImageUrl?: string;
  storyLead?: string;
  storyBody?: string;
  aboutImageUrl?: string;
  memberPhotos?: Record<string, string>;
  events?: EditableEvent[];
  terms?: string;
  privacy?: string;
};

let browserClient: SupabaseClient | null | undefined;
const FAN_COOKIE = "monstiez_session";

function writeFanCookie(user: FanUser | null) {
  if (typeof document === "undefined") return;
  if (!user) {
    document.cookie = `${FAN_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
    return;
  }
  const value = encodeURIComponent(JSON.stringify({ nickname: user.nickname, role: user.role }));
  document.cookie = `${FAN_COOKIE}=${value}; Max-Age=2592000; Path=/; SameSite=Lax; Secure`;
}

export function supabaseClient() {
  if (browserClient !== undefined) return browserClient;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  browserClient = url && key ? createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }) : null;
  return browserClient;
}

export function supabaseConfigured() { return Boolean(supabaseClient()); }

async function profileFor(authUser: AuthUser): Promise<FanUser> {
  const client = supabaseClient();
  const fallbackNickname = String(authUser.user_metadata?.nickname || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "MONSTIEZ").slice(0, 24);
  if (!client) return { id: authUser.id, nickname: fallbackNickname, email: authUser.email, role: "monstiez" };
  const { data } = await client.from("profiles").select("nickname,role").eq("id", authUser.id).maybeSingle();
  return { id: authUser.id, nickname: data?.nickname || fallbackNickname, email: authUser.email, role: data?.role || "monstiez" };
}

export async function currentFanUser() {
  const client = supabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  const user = data.user ? await profileFor(data.user) : null;
  writeFanCookie(user);
  return user;
}

export function observeFanUser(callback: (user: FanUser | null) => void) {
  const client = supabaseClient();
  if (!client) { callback(null); return () => {}; }
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) { writeFanCookie(null); callback(null); }
    else void profileFor(session.user).then(user => { writeFanCookie(user); callback(user); });
  });
  return () => data.subscription.unsubscribe();
}

export async function emailAuth(mode: "login" | "register", email: string, password: string, nickname?: string) {
  const client = supabaseClient();
  if (!client) throw new Error("SUPABASE_NOT_CONFIGURED");
  if (mode === "register") {
    const { data, error } = await client.auth.signUp({ email, password, options: { data: { nickname } } });
    if (error) throw error;
    const user = data.user ? await profileFor(data.user) : null;
    writeFanCookie(user);
    return user;
  }
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const user = data.user ? await profileFor(data.user) : null;
  writeFanCookie(user);
  return user;
}

export async function socialAuth(provider: "google" | "kakao") {
  const client = supabaseClient();
  if (!client) throw new Error("SUPABASE_NOT_CONFIGURED");
  const providerId = provider as Provider;
  const { error } = await client.auth.signInWithOAuth({
    provider: providerId,
    options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
  });
  if (error) throw error;
}

export async function signOutFan() {
  const client = supabaseClient();
  if (client) await client.auth.signOut();
  writeFanCookie(null);
}

export async function listFanPosts(viewer: FanUser | null): Promise<FanPost[]> {
  const client = supabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("posts")
    .select("id,user_id,body,source_language,status,created_at,updated_at,profiles!posts_user_id_fkey(nickname,role)")
    .order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  const ids = (data || []).map(row => Number(row.id));
  const [{ data: counts }, { data: ownLikes }] = ids.length ? await Promise.all([
    client.from("post_like_counts").select("post_id,likes").in("post_id", ids),
    viewer ? client.from("post_likes").select("post_id").in("post_id", ids) : Promise.resolve({ data: [] }),
  ]) : [{ data: [] }, { data: [] }];
  const countMap = new Map((counts || []).map(row => [Number(row.post_id), Number(row.likes)]));
  const ownLikeIds = new Set((ownLikes || []).map(row => Number(row.post_id)));
  return (data || []).map((row: Record<string, unknown>) => {
    const profileValue = row.profiles as { nickname?: string; role?: FanRole } | Array<{ nickname?: string; role?: FanRole }> | null;
    const profile = Array.isArray(profileValue) ? profileValue[0] : profileValue;
    return {
      id: Number(row.id), userId: String(row.user_id), nickname: profile?.nickname || "MONSTIEZ", role: profile?.role || "monstiez",
      body: String(row.body), sourceLanguage: String(row.source_language), likes: countMap.get(Number(row.id)) || 0, comments: 0,
      liked: ownLikeIds.has(Number(row.id)),
      canEdit: Boolean(viewer && (viewer.id === row.user_id || viewer.role === "admin")),
      createdAt: new Date(String(row.created_at)).toLocaleDateString("en-CA"),
    };
  });
}

export async function createFanPost(body: string, sourceLanguage: string) {
  const client = supabaseClient();
  if (!client) throw new Error("SUPABASE_NOT_CONFIGURED");
  const { error } = await client.from("posts").insert({ body, source_language: sourceLanguage });
  if (error) throw error;
}

export async function editFanPost(id: number, body: string) {
  const client = supabaseClient();
  if (!client) throw new Error("SUPABASE_NOT_CONFIGURED");
  const { error } = await client.from("posts").update({ body, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteFanPost(id: number) {
  const client = supabaseClient();
  if (!client) throw new Error("SUPABASE_NOT_CONFIGURED");
  const { error } = await client.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export async function moderateFanPost(id: number) {
  const client = supabaseClient();
  if (!client) throw new Error("SUPABASE_NOT_CONFIGURED");
  const { error } = await client.from("posts").update({ status: "hidden", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function reportFanPost(postId: number, reason = "community-report") {
  const client = supabaseClient();
  if (!client) throw new Error("SUPABASE_NOT_CONFIGURED");
  const { error } = await client.from("reports").upsert({ post_id: postId, reason }, { onConflict: "post_id,reporter_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function toggleFanLike(postId: number, liked: boolean) {
  const client = supabaseClient();
  if (!client) throw new Error("SUPABASE_NOT_CONFIGURED");
  const operation = liked ? client.from("post_likes").delete().eq("post_id", postId) : client.from("post_likes").insert({ post_id: postId });
  const { error } = await operation;
  if (error) throw error;
}

export async function translateFanPost(postId: number, target: string, original: string) {
  const client = supabaseClient();
  if (!client) return original;
  const { data, error } = await client.functions.invoke("translate-comment", { body: { postId, target } });
  if (error) return original;
  return String(data?.text || original);
}

export async function listAnnouncements(locale: string) {
  const client = supabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("announcements").select("id,title,body,published_at")
    .eq("locale", locale).order("pinned", { ascending: false }).order("published_at", { ascending: false }).limit(5);
  if (error) throw error;
  return data || [];
}

export async function loadSiteContent(): Promise<SiteContent> {
  const client = supabaseClient();
  if (!client) return {};
  const { data, error } = await client.from("site_content").select("key,value");
  if (error) return {};
  return (data || []).reduce((content, row) => ({ ...content, [String(row.key)]: row.value }), {} as SiteContent);
}

export async function saveSiteContent(content: SiteContent) {
  const client = supabaseClient();
  if (!client) throw new Error("SUPABASE_NOT_CONFIGURED");
  const rows = Object.entries(content).map(([key, value]) => ({ key, value }));
  const { error } = await client.from("site_content").upsert(rows, { onConflict: "key" });
  if (error) throw error;
}
