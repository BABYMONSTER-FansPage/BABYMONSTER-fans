import { env } from "cloudflare:workers";

export type UserRole = "monstiez" | "admin" | "artist";
export type SessionUser = { id: number; nickname: string; email?: string; role: UserRole };

function db() {
  const binding = (env as unknown as { DB?: D1Database }).DB;
  if (!binding) throw new Error("DB_UNAVAILABLE");
  return binding;
}

export async function ensureDatabase() {
  const d1 = db();
  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      nickname TEXT NOT NULL,
      password_hash TEXT,
      password_salt TEXT,
      provider TEXT,
      provider_id TEXT,
      role TEXT NOT NULL DEFAULT 'monstiez' CHECK(role IN ('monstiez','admin','artist')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    d1.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_identity ON users(provider, provider_id) WHERE provider_id IS NOT NULL"),
    d1.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)"),
    d1.prepare(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL CHECK(length(body) BETWEEN 2 AND 500),
      source_language TEXT NOT NULL DEFAULT 'zh-TW',
      status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published','hidden','pending')),
      updated_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)"),
    d1.prepare(`CREATE TABLE IF NOT EXISTS likes (
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(post_id, user_id)
    )`),
    d1.prepare(`CREATE TABLE IF NOT EXISTS post_translations (
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      target_language TEXT NOT NULL,
      translated_body TEXT NOT NULL,
      provider TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(post_id, target_language)
    )`),
    d1.prepare(`CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','dismissed')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, reporter_id)
    )`),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC)"),
    d1.prepare(`CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'zh-TW',
      published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      starts_at TEXT,
      ends_at TEXT,
      pinned INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    )`),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(locale, pinned DESC, published_at DESC)"),
  ]);
  await ensureColumn(d1, "users", "role", "TEXT NOT NULL DEFAULT 'monstiez'");
  await ensureColumn(d1, "posts", "source_language", "TEXT NOT NULL DEFAULT 'zh-TW'");
  await ensureColumn(d1, "posts", "status", "TEXT NOT NULL DEFAULT 'published'");
  await ensureColumn(d1, "posts", "updated_at", "TEXT");
}

async function ensureColumn(d1: D1Database, table: string, column: string, definition: string) {
  const info = await d1.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  if (!info.results.some(item => item.name === column)) {
    try { await d1.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run(); }
    catch (error) { if (!String(error).toLowerCase().includes("duplicate column")) throw error; }
  }
}

function bytesToBase64(bytes: Uint8Array) {
  let value = "";
  bytes.forEach(byte => value += String.fromCharCode(byte));
  return btoa(value);
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}

export async function hashPassword(password: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 210_000 }, material, 256);
  return { hash: bytesToBase64(new Uint8Array(bits)), salt: bytesToBase64(salt) };
}

export async function verifyPassword(password: string, expectedHash: string, salt: string) {
  const actual = await hashPassword(password, base64ToBytes(salt));
  const a = base64ToBytes(actual.hash);
  const b = base64ToBytes(expectedHash);
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") || "";
  const pair = header.split(";").map(v => v.trim()).find(v => v.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
}

export async function createSession(userId: number) {
  await ensureDatabase();
  const token = bytesToBase64(crypto.getRandomValues(new Uint8Array(32))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  const tokenHash = await digest(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db().prepare("INSERT INTO sessions(token_hash, user_id, expires_at) VALUES(?, ?, ?)").bind(tokenHash, userId, expiresAt).run();
  return token;
}

export function sessionCookie(token: string, request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `monstiez_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
}

export function clearSessionCookie() {
  return "monstiez_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const token = readCookie(request, "monstiez_session");
  if (!token) return null;
  await ensureDatabase();
  const row = await db().prepare(`SELECT users.id, users.nickname, users.email, users.role
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > CURRENT_TIMESTAMP`).bind(await digest(token)).first<SessionUser>();
  return row || null;
}

export async function deleteSession(request: Request) {
  const token = readCookie(request, "monstiez_session");
  if (token) { await ensureDatabase(); await db().prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await digest(token)).run(); }
}

export async function findOrCreateOAuthUser(provider: string, providerId: string, email: string | null, nickname: string) {
  await ensureDatabase();
  const existing = await db().prepare("SELECT id, nickname, email, role FROM users WHERE provider = ? AND provider_id = ?").bind(provider, providerId).first<SessionUser>();
  if (existing) return existing;
  const result = await db().prepare("INSERT INTO users(email, nickname, provider, provider_id) VALUES(?, ?, ?, ?)").bind(email, nickname.slice(0, 24), provider, providerId).run();
  return { id: Number(result.meta.last_row_id), nickname: nickname.slice(0, 24), email: email || undefined, role: "monstiez" as const };
}

export { db };
