import type { SessionUser, UserRole } from "./database";

export function isVerifiedRole(role: UserRole) {
  return role === "admin" || role === "artist";
}

export function canEditPost(user: SessionUser, authorId: number) {
  return user.id === authorId || user.role === "admin";
}

export function canDeletePost(user: SessionUser, authorId: number) {
  return user.id === authorId || user.role === "admin";
}

export function canModerate(user: SessionUser) {
  return user.role === "admin";
}

export function roleLabelKey(role: UserRole) {
  if (role === "admin") return "roleAdmin";
  if (role === "artist") return "roleArtist";
  return null;
}
