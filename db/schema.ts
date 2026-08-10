import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").unique(),
  nickname: text("nickname").notNull(),
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
  provider: text("provider"),
  providerId: text("provider_id"),
  role: text("role", { enum: ["monstiez", "admin", "artist"] }).notNull().default("monstiez"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [uniqueIndex("idx_users_provider_identity").on(table.provider, table.providerId)]);

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [index("idx_sessions_user_id").on(table.userId)]);

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  sourceLanguage: text("source_language").notNull().default("zh-TW"),
  status: text("status", { enum: ["published", "hidden", "pending"] }).notNull().default("published"),
  updatedAt: text("updated_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [index("idx_posts_status_created_at").on(table.status, table.createdAt)]);

export const likes = sqliteTable("likes", {
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [primaryKey({ columns: [table.postId, table.userId] })]);

export const postTranslations = sqliteTable("post_translations", {
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  targetLanguage: text("target_language").notNull(),
  translatedBody: text("translated_body").notNull(),
  provider: text("provider").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [primaryKey({ columns: [table.postId, table.targetLanguage] })]);

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  reporterId: integer("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["open", "resolved", "dismissed"] }).notNull().default("open"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [uniqueIndex("idx_reports_post_reporter").on(table.postId, table.reporterId), index("idx_reports_status_created_at").on(table.status, table.createdAt)]);

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  locale: text("locale").notNull().default("zh-TW"),
  publishedAt: text("published_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
}, table => [index("idx_announcements_locale_pinned_published").on(table.locale, table.pinned, table.publishedAt)]);
