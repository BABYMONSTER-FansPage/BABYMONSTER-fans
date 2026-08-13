"use client";

import { createContext, FormEvent, type CSSProperties, type MouseEvent, type ReactNode, useContext, useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import {
  Play, Heart, MessageCircle,
  ChevronDown, Menu, X, Calendar, MapPin, Music, Send, Disc3, Settings, Save, ExternalLink, Pencil,
} from "lucide-react";
import { fixedMessages, getInitialLocale, localeLabels, messages, supportedLocales, type Locale } from "./i18n";
import {
  addNicknameBlacklist, createFanPost, createFanReply, currentFanUser, deleteFanPost, editFanPost, emailAuth, listFanPosts, listNicknameBlacklist,
  fetchSpotifyReleaseStatus, listAnnouncements, listFanReplies, listModerationNotifications, loadSiteContent, moderateFanPost, observeFanUser, reportFanPost, reviewModerationNotification,
  removeNicknameBlacklist, requestPasswordReset, resendSignupOtp, saveSiteContent, signOutFan, socialAuth, toggleFanLike, translateFanPost, updateFanNickname, updateFanPassword,
  verifyEmailOtp, verifyPasswordRecoveryOtp,
  type EditableEvent, type FanPost as ApiPost, type FanReply, type FanUser as User, type ModerationNotification, type NicknameBlacklistEntry, type SiteContent, type SpotifyRelease,
} from "./lib/supabase-browser";

// ─────────────────────────────────────────────
// PRE-COMPUTED CONSTANTS
// ─────────────────────────────────────────────

const HERO_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${5 + ((i * 5.7) % 88)}%`,
  top: `${8 + ((i * 6.3) % 82)}%`,
  dur: 3.4 + ((i * 0.37) % 2.8),
  delay: (i * 0.29) % 4.5,
  size: i % 3 === 0 ? 3 : 1.5,
}));

const communityActions: Record<Locale, {
  reply: string; replyPlaceholder: string; sendReply: string; replySaved: string; replyFailed: string; reported: string; reportFailed: string;
}> = {
  "zh-TW": { reply: "回覆", replyPlaceholder: "在這則留言下回覆…", sendReply: "送出回覆", replySaved: "回覆已發布", replyFailed: "回覆儲存失敗，請重新登入後再試", reported: "已送出檢舉", reportFailed: "目前無法檢舉" },
  "zh-CN": { reply: "回复", replyPlaceholder: "在这条留言下回复…", sendReply: "发送回复", replySaved: "回复已发布", replyFailed: "回复保存失败，请重新登录后再试", reported: "已提交举报", reportFailed: "目前无法举报" },
  th: { reply: "ตอบกลับ", replyPlaceholder: "ตอบกลับใต้โพสต์นี้…", sendReply: "ส่งคำตอบ", replySaved: "เผยแพร่คำตอบแล้ว", replyFailed: "บันทึกคำตอบไม่สำเร็จ โปรดเข้าสู่ระบบอีกครั้ง", reported: "ส่งรายงานแล้ว", reportFailed: "ไม่สามารถรายงานได้" },
  en: { reply: "Reply", replyPlaceholder: "Reply to this post…", sendReply: "Post reply", replySaved: "Reply published", replyFailed: "Reply could not be saved. Sign in again and retry", reported: "Report submitted", reportFailed: "Unable to report" },
  ko: { reply: "답글", replyPlaceholder: "이 게시물에 답글 쓰기…", sendReply: "답글 등록", replySaved: "답글이 게시되었습니다", replyFailed: "답글을 저장하지 못했습니다. 다시 로그인해 주세요", reported: "신고가 접수되었습니다", reportFailed: "신고할 수 없습니다" },
  ja: { reply: "返信", replyPlaceholder: "この投稿に返信…", sendReply: "返信を投稿", replySaved: "返信を投稿しました", replyFailed: "返信を保存できませんでした。再ログインしてください", reported: "通報しました", reportFailed: "通報できません" },
};

function useMobileViewport() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return mobile;
}

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const MEMBERS = [
  {
    id: "ruka", num: "01", name: "RUKA",
    birth: "2002 · Mar 20", nationality: "Japan", flag: "JP",
    position: "Main Vocalist",
    description: "The eldest of BABYMONSTER, Ruka commands the stage with powerhouse vocals and an effortless grace honed through years of rigorous training. Her emotional depth and unwavering presence define the group's vocal identity.",
    traits: ["Main Vocalist", "Eldest Member", "Stage Commander"],
    photo: "photo-1531746020798-e6953c6e8e04",
    accent: "#E01020",
  },
  {
    id: "pharita", num: "02", name: "PHARITA",
    birth: "2005 · Aug 26", nationality: "Thailand", flag: "TH",
    position: "Vocalist · Rapper",
    description: "Fierce, fearless, and relentlessly captivating — Pharita brings Thailand's pride to every stage. Her dual mastery of rap and melody makes her one of the most versatile forces in the group.",
    traits: ["Versatile Performer", "High Energy", "Thai Pioneer"],
    photo: "photo-1536766768598-e09213fdcf22",
    accent: "#ff2d2d",
  },
  {
    id: "asa", num: "03", name: "ASA",
    birth: "2006 · Apr 17", nationality: "Japan", flag: "JP",
    position: "Vocalist · Main Dancer",
    description: "Where precision meets artistry — Asa's dance mastery is a study in technique and emotion. Every gesture intentional, every movement a brushstroke. She is the visual pulse of BABYMONSTER.",
    traits: ["Main Dancer", "Precision Artist", "Visual Icon"],
    photo: "photo-1508214751196-bcfd4ca60f91",
    accent: "#cc1a1a",
  },
  {
    id: "ahyeon", num: "04", name: "AHYEON",
    birth: "2007 · Apr 11", nationality: "Korea", flag: "KR",
    position: "Main Rapper · Vocalist",
    description: "Before the official debut, Ahyeon went viral worldwide — proof that true talent cannot be contained. Her rap flows with razor precision while her vocals carry a haunting melodic quality unlike anything in K-pop.",
    traits: ["Main Rapper", "Global Viral", "Genre-Defying"],
    photo: "photo-1524504388940-b1c1722653e1",
    accent: "#E01020",
  },
  {
    id: "rami", num: "05", name: "RAMI",
    birth: "2007 · Oct 17", nationality: "Korea", flag: "KR",
    position: "Vocalist",
    description: "Rami's voice carries a warmth and emotional sincerity that transcends age. When she sings, you feel every word. Her genuine connection with fans has made her one of the most cherished members.",
    traits: ["Pure Vocalist", "Fan Favorite", "Genuine Heart"],
    photo: "photo-1544005313-94ddf0286df2",
    accent: "#ff4040",
  },
  {
    id: "rora", num: "06", name: "RORA",
    birth: "2008 · Aug 14", nationality: "Korea", flag: "KR",
    position: "Performer",
    description: "Rora brings a warm and expressive vocal color to the group.",
    traits: ["Vocal Color", "Warm Tone", "Performer"],
    photo: "photo-1489424731084-a5d8b219a5bb",
    accent: "#b30000",
  },
  {
    id: "chiquita", num: "07", name: "CHIQUITA",
    birth: "2009 · Feb 17", nationality: "Thailand", flag: "TH",
    position: "Performer",
    description: "Chiquita brings bright vocal color and explosive stage energy.",
    traits: ["Bright Energy", "Stage Presence", "Performer"],
    photo: "photo-1438761681033-6461ffad8d80",
    accent: "#cc0000",
  },
];

const ALBUMS = [
  {
    id: 1, title: "DRIP", year: "2024", type: "1st Mini Album",
    tracks: ["DRIP", "LIKE THAT", "FOREVER", "SHEESH", "BATTER UP"],
    description: "The definitive debut album. Seven monsters, one world-shaking statement.",
    photo: "photo-1598387992571-f30bed6c6a93",
  },
  {
    id: 2, title: "SHEESH", year: "2024", type: "Digital Single",
    tracks: ["SHEESH"],
    description: "A sonic declaration of confidence. Seven voices, one undeniable statement.",
    photo: "photo-1540039155733-5bb30b53aa14",
  },
  {
    id: 3, title: "BATTER UP", year: "2023", type: "Pre-Release Single",
    tracks: ["BATTER UP"],
    description: "The world's first meeting with BABYMONSTER. Nothing was ever the same after.",
    photo: "photo-1501386761578-eac5c94b800a",
  },
];

const EVENTS: EditableEvent[] = [
  {
    id: 1, title: "BABYMONSTER", sub: "OFFICIAL SCHEDULE",
    dates: "2026–2027", locations: "Worldwide",
    type: "Official", status: "upcoming", desc: "Official schedules and tour notices.",
  },
  {
    id: 2, title: "SPOTIFY · YOUTUBE", sub: "OFFICIAL RELEASES",
    dates: "ON DEMAND", locations: "Official platforms",
    type: "Media", status: "upcoming", desc: "Music, performances, and behind-the-scenes content.",
  },
  {
    id: 3, title: "YG ENTERTAINMENT", sub: "OFFICIAL NEWS",
    dates: "LATEST", locations: "YG official channels",
    type: "News", status: "upcoming", desc: "Verify changing schedules with the organizer.",
  },
  {
    id: 4, title: "MONSTIEZ", sub: "GLOBAL COMMUNITY",
    dates: "ALWAYS ON", locations: "babymonster.fans",
    type: "Community", status: "upcoming", desc: "Fan conversations from around the world.",
  },
];

const DEFAULT_SITE_CONTENT: Required<Pick<SiteContent, "siteTagline">> = {
  siteTagline: "",
};

const OFFICIAL_BRAND_NAME = "Monstiez";
const SITE_BROWSER_TITLE = "Monstiez｜BABYMONSTER Fan Community";
const FIXED_FAVICON_URL = "/favicon.svg";
const PRIVACY_POLICY_URL = "https://babymonster.fans/privacy.html";
const TERMS_OF_SERVICE_URL = "https://babymonster.fans/terms.html";
const SITE_CONTENT_CACHE_KEY = "monstiez-site-content-v1";

function cachedSiteContent(): SiteContent {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(SITE_CONTENT_CACHE_KEY) || "{}"); }
  catch { return {}; }
}

function cacheSiteContent(content: SiteContent) {
  try { localStorage.setItem(SITE_CONTENT_CACHE_KEY, JSON.stringify(content)); }
  catch { /* Storage can be unavailable in private browsing. */ }
}

function contentText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function contentUrl(value: unknown, fallback: string) {
  return typeof value === "string" && /^https?:\/\//.test(value.trim()) ? value.trim() : fallback;
}

function localizedMemberBio(name: string, nationality: string, locale: Locale, detailed = false) {
  const country = nationality === "Japan"
    ? fixedMessages[locale].countryJapan
    : nationality === "Korea" ? fixedMessages[locale].countryKorea : fixedMessages[locale].countryThailand;
  const copy: Record<Locale, [string, string]> = {
    "zh-TW": [`${name} 是來自${country}的 BABYMONSTER 成員。`, `認識 ${name} 在 BABYMONSTER 的音樂、舞台與官方公開活動。本站僅整理公開資訊；最新資料請以 YG Entertainment 與 BABYMONSTER 官方公告為準。`],
    "zh-CN": [`${name} 是来自${country}的 BABYMONSTER 成员。`, `了解 ${name} 在 BABYMONSTER 的音乐、舞台与官方公开活动。本站仅整理公开信息；最新资料请以 YG Entertainment 与 BABYMONSTER 官方公告为准。`],
    th: [`${name} เป็นสมาชิก BABYMONSTER จาก${country}`, `ติดตามผลงานเพลง เวที และกิจกรรมทางการของ ${name} กับ BABYMONSTER เว็บไซต์นี้รวบรวมเฉพาะข้อมูลสาธารณะ โปรดตรวจสอบข้อมูลล่าสุดจาก YG Entertainment และช่องทางทางการของ BABYMONSTER`],
    en: [`${name} is a BABYMONSTER member from ${country}.`, `Explore ${name}'s music, performances, and officially announced activities with BABYMONSTER. This site summarizes public information only; check YG Entertainment and BABYMONSTER's official channels for the latest details.`],
    ko: [`${name}는 ${country} 출신의 BABYMONSTER 멤버입니다.`, `${name}의 BABYMONSTER 음악, 무대 및 공식 활동을 살펴보세요. 이 사이트는 공개 정보만 정리하며 최신 내용은 YG Entertainment와 BABYMONSTER 공식 채널을 확인해 주세요.`],
    ja: [`${name}は${country}出身のBABYMONSTERメンバーです。`, `${name}のBABYMONSTERでの音楽、ステージ、公式活動を紹介します。本サイトは公開情報のみを整理しており、最新情報はYG EntertainmentおよびBABYMONSTER公式チャンネルをご確認ください。`],
  };
  return copy[locale][detailed ? 1 : 0];
}

function localizedTextKey(key: string, locale: Locale) {
  return `${key}.${locale}`;
}

function normalizeTrackNames(value: unknown) {
  const normalize = (item: unknown) => {
    if (typeof item === "string") return item.trim();
    if (item && typeof item === "object" && "name" in item) return String((item as { name?: unknown }).name || "").trim();
    return "";
  };

  if (Array.isArray(value)) return value.map(normalize).filter(Boolean);
  if (typeof value === "string") return value.split(/[,;\n]/).map(item => item.trim()).filter(Boolean);
  return [];
}

function youtubeTrackUrl(trackName: string) {
  const query = `BABYMONSTER ${trackName} official audio`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function normalizeInstagramUrl(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const embeddedUrl = raw.match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s)\]"'<>]+/i)?.[0]
    || raw.match(/(?:www\.)?instagram\.com\/[^\s)\]"'<>]+/i)?.[0]
    || raw;
  const cleaned = embeddedUrl
    .replace(/^<|>$/g, "")
    .replace(/[.,;，。；]+$/g, "")
    .trim();
  const withProtocol = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned.replace(/^\/+/, "")}`;
  try {
    const parsed = new URL(withProtocol);
    if (!/(^|\.)instagram\.com$/i.test(parsed.hostname)) return "";
    const [kind, shortcode] = parsed.pathname.split("/").filter(Boolean);
    const normalizedKind = kind === "reels" ? "reel" : kind;
    if (!["p", "reel", "tv"].includes(normalizedKind) || !shortcode) return "";
    return `https://www.instagram.com/${normalizedKind}/${shortcode}/`;
  } catch {
    return "";
  }
}

function normalizeInstagramPosts(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(normalizeInstagramUrl).filter(Boolean)));
}

function normalizeMemberInstagramPosts(value: unknown) {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return MEMBERS.reduce<Record<string, string[]>>((posts, member) => {
    const normalized = normalizeInstagramPosts((value as Record<string, unknown>)[member.id]);
    if (normalized.length) posts[member.id] = normalized;
    return posts;
  }, {});
}

function instagramEmbedUrl(url: string) {
  return `${url}embed/`;
}

function InstagramEmbedFrame({ url, index, label }: { url: string; index: number; label: string }) {
  return (
    <div className="relative h-[560px] overflow-hidden bg-white">
      <iframe
        title={`Instagram official post ${index + 1}`}
        src={instagramEmbedUrl(url)}
        className="h-full w-full border-0 bg-white"
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="absolute inset-x-4 bottom-4 z-20 border border-white/15 bg-black/75 px-4 py-3 text-center text-xs tracking-[0.18em] text-white/70 backdrop-blur transition hover:border-red-500/50 hover:text-white"
      >
        <span className="inline-flex items-center justify-center gap-2">{label}<ExternalLink size={13} aria-hidden="true" /></span>
      </a>
    </div>
  );
}

type InlineEditContextValue = {
  editing: boolean;
  locale: Locale;
  text: (key: string, fallback?: string) => string;
  image: (key: string) => string;
  openTextEditor: (key: string, fallback?: string) => void;
  updateImage: (key: string, value: string) => void;
};

const InlineEditContext = createContext<InlineEditContextValue>({
  editing: false,
  locale: "zh-TW",
  text: (_key, fallback = "") => fallback,
  image: () => "",
  openTextEditor: () => {},
  updateImage: () => {},
});

function EditPencil({ onClick, label }: { onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick}
    className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-red-500/45 bg-black/75 text-red-300 hover:text-white hover:border-red-300 align-middle ml-2"
    aria-label={label}><Pencil size={13} aria-hidden="true" /></button>;
}

function VerificationBadge({ role, label }: { role: "admin" | "artist"; label: string }) {
  return <span className={`verification-badge ${role}`} title={label} aria-label={label}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 1.7 14.4 3l2.7-.1 1.3 2.4 2.4 1.3-.1 2.7L22 12l-1.3 2.4.1 2.7-2.4 1.3-1.3 2.4-2.7-.1L12 22l-2.4-1.3-2.7.1-1.3-2.4-2.4-1.3.1-2.7L2 12l1.3-2.7-.1-2.7 2.4-1.3 1.3-2.4 2.7.1L12 1.7Z" />
      <path d="m7.7 12.1 2.7 2.7 5.9-6" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>;
}

function EditableText({ k, fallback = "", as = "span", className, style, children }: {
  k: string; fallback?: string; as?: "span" | "p" | "h1" | "h2" | "h3" | "div";
  className?: string; style?: CSSProperties; children?: ReactNode;
}) {
  const editor = useContext(InlineEditContext);
  const f = fixedMessages[editor.locale];
  const Tag = as;
  const value = editor.text(k, fallback);
  const visible = value || (editor.editing ? f.editPlaceholder : "");
  if (!visible && !children) return null;
  return <Tag className={className} style={style}>
    {children ?? visible}
    {editor.editing && <EditPencil label={`Edit ${k}`} onClick={() => editor.openTextEditor(k, fallback)} />}
  </Tag>;
}

function EditableImage({ k, alt, className, style }: { k: string; alt: string; className?: string; style?: CSSProperties }) {
  const editor = useContext(InlineEditContext);
  const f = fixedMessages[editor.locale];
  const url = editor.image(k);
  if (!url && !editor.editing) return null;
  return <div className="relative w-full h-full">
    {url
      ? <img src={url} alt={alt} className={className} style={style} />
      : <div className={`${className || ""} grid place-items-center border border-dashed border-red-500/35 text-red-300/60 text-xs tracking-widest uppercase`}>{f.addImagePlaceholder}</div>}
    {editor.editing && <div className="absolute top-3 right-3"><EditPencil label={`Edit image ${k}`} onClick={() => {
      const next = window.prompt(f.imageUrlPrompt, url);
      if (next !== null) editor.updateImage(k, next);
    }} /></div>}
  </div>;
}

const EMPTY_POSTS: ApiPost[] = [];

// ─────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────

function Nav({ user, locale, onLocale, onLogin, onLogout, onAdmin, onEdit }: {
  user: User | null; locale: Locale;
  onLocale: (locale: Locale) => void; onLogin: () => void; onLogout: () => void; onAdmin: () => void; onEdit: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const mobile = useMobileViewport();

  useEffect(() => {
    let frame = 0;
    const fn = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => { frame = 0; setScrolled(window.scrollY > 60); });
    };
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => { window.removeEventListener("scroll", fn); if (frame) window.cancelAnimationFrame(frame); };
  }, []);

  const t = messages[locale];
  const links = [
    { id: "members", label: t.nav[1] }, { id: "music", label: t.nav[2] },
    { id: "events", label: t.nav[3] }, { id: "community", label: t.nav[4] },
  ];
  function navigateTo(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    setOpen(false);
    window.history.replaceState(null, "", `#${id}`);
    window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: mobile ? "auto" : "smooth", block: "start" }));
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[150] transition-colors duration-200 ${
        scrolled ? "border-b border-white/5" : ""
      }`}
      style={{ background: scrolled || mobile || open ? "rgba(5,5,5,0.97)" : "transparent", backdropFilter: scrolled && !mobile ? "blur(20px)" : "none" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="font-black text-xl tracking-[0.12em] text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          MON<span style={{ color: "#E01020" }}>STIEZ</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map(link => (
            <a key={link.id} href={`#${link.id}`}
              className="text-white/60 hover:text-white text-xs tracking-[0.25em] uppercase transition-colors duration-200">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <select value={locale} onChange={event => onLocale(event.target.value as Locale)}
            aria-label={messages[locale].language}
            className="bg-black/60 border border-white/15 rounded-full px-3 py-1.5 text-white/60 text-xs focus:outline-none focus:border-red-600/50">
            {supportedLocales.map(code => <option key={code} value={code}>{localeLabels[code]}</option>)}
          </select>
          {user
            ? <button onClick={onLogout} className="hidden sm:block text-white/50 hover:text-white text-xs tracking-widest uppercase">{user.nickname} · {messages[locale].logout}</button>
            : <button onClick={onLogin} className="hidden sm:block text-white/50 hover:text-white text-xs tracking-widest uppercase">{messages[locale].login}</button>}
          {user?.role === "admin" && <button onClick={onEdit} className="text-red-400/80 hover:text-red-300" aria-label="Edit mode"><Pencil size={16} aria-hidden="true" /></button>}
          {user?.role === "admin" && <button onClick={onAdmin} className="text-red-400/80 hover:text-red-300" aria-label="Admin dashboard"><Settings size={16} /></button>}
          <button type="button" className="md:hidden relative z-10 grid min-w-11 place-items-center text-white/70 hover:text-white" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-navigation">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div id="mobile-navigation" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="md:hidden fixed inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/8 px-6 py-5 flex flex-col gap-4 shadow-2xl"
          style={{ background: "rgba(5,5,5,0.97)" }}>
          {links.map(link => (
            <a key={link.id} href={`#${link.id}`} onClick={event => navigateTo(event, link.id)}
              className="flex min-h-12 items-center border-b border-white/5 text-white/70 hover:text-white text-sm tracking-[0.25em] uppercase">
              {link.label}
            </a>
          ))}
          <button onClick={() => { setOpen(false); if (user) onLogout(); else onLogin(); }} className="min-h-11 text-left text-red-400 text-sm tracking-[0.2em] uppercase">
            {user ? `${user.nickname} · ${t.logout}` : t.login}
          </button>
          {user?.role === "admin" && <button onClick={() => { setOpen(false); onAdmin(); }} className="min-h-11 text-left text-white/60 text-sm tracking-[0.2em] uppercase">Admin</button>}
          {user?.role === "admin" && <button onClick={() => { setOpen(false); onEdit(); }} className="min-h-11 text-left text-white/60 text-sm tracking-[0.2em] uppercase">Edit mode</button>}
        </motion.div>
      )}
    </nav>
  );
}

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────

function Hero({ locale, content }: { locale: Locale; content: SiteContent }) {
  const t = messages[locale];
  const heroImage = contentUrl(content.heroImageUrl, "");
  const mobile = useMobileViewport();
  return (
    <section id="top" className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Concert bg */}
      <div className="absolute inset-0">
        {heroImage && <img src={heroImage} alt="Hero visual" className="w-full h-full object-cover opacity-20" />}
        {!heroImage && <EditableImage k="heroImageUrl" alt="Hero visual" className="w-full h-full object-cover opacity-20" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full blur-[130px]"
          style={{ background: "rgba(224,16,32,0.18)" }} />
      </div>

      {/* Floating particles */}
      {!mobile && HERO_PARTICLES.map(p => (
        <motion.div key={p.id} className="hero-particle absolute rounded-full pointer-events-none"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, background: "#E01020" }}
          animate={{ y: [0, -18, 0], opacity: [0.2, 0.9, 0.2], scale: [1, 1.6, 1] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }} />
      ))}

      {/* Main content */}
      <div className="relative z-10 text-center px-4">
        <motion.p initial={mobile ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-white/35 text-xs tracking-[0.45em] uppercase mb-8">
          <EditableText k="heroKicker" fallback={contentText(content.heroKicker, t.heroKicker)} />
        </motion.p>

        {/* BABYMONSTER — hero artist name */}
        <div className="overflow-hidden leading-none">
          <motion.div initial={mobile ? false : { y: "110%" }} animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}>
            <span className="font-black text-white block leading-[0.88]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.25rem, 12.5vw, 11rem)" }}>
              BABY<span style={{ color: "#E01020" }}>MONSTER</span>
            </span>
          </motion.div>
        </div>

        {/* Stat row */}
        <motion.div initial={mobile ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.35 }}
          className="flex items-center justify-center gap-10 md:gap-20 mt-12 mb-16">
          {[{ v: "7", l: t.membersLabel }, { v: "3", l: t.nationalities }, { v: "2024", l: t.debut }].map(({ v, l }) => (
            <div key={l} className="text-center">
              <div className="font-black text-white text-4xl md:text-5xl leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{v}</div>
              <div className="text-white/35 text-xs tracking-widest uppercase mt-1.5">{l}</div>
            </div>
          ))}
        </motion.div>

      </div>

      {/* Scroll indicator */}
      <motion.div initial={mobile ? false : { opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 2.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown size={15} className="text-white/25" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function AppPurposeSection({ locale }: { locale: Locale }) {
  const f = fixedMessages[locale];
  return (
    <section id="purpose" aria-labelledby="official-app-name" className="bg-black border-t border-white/8 py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mx-auto max-w-4xl border border-white/10 bg-white/[0.025] p-6 text-center md:p-10">
          <p className="text-white/35 text-[10px] tracking-[0.35em] uppercase mb-3">{f.officialAppNameLabel}</p>
          <h2 id="official-app-name" className="text-white text-4xl md:text-5xl font-black tracking-wide leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Monstiez
          </h2>
          <p className="text-red-300/75 text-[11px] md:text-xs tracking-[0.22em] uppercase mt-3">
            {f.fanCommunityPlatform}
          </p>
          <p className="mx-auto mt-5 max-w-3xl text-white/58 text-sm md:text-base leading-relaxed">
            {f.appPurpose}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a href={PRIVACY_POLICY_URL} className="inline-flex items-center gap-2 text-red-300 hover:text-red-200 text-xs tracking-[0.25em] uppercase">{f.privacyPolicy}<ExternalLink size={12} aria-hidden="true" /></a>
            <a href={TERMS_OF_SERVICE_URL} className="inline-flex items-center gap-2 text-white/35 hover:text-white text-xs tracking-[0.25em] uppercase">{f.termsOfService}<ExternalLink size={12} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// ABOUT
// ─────────────────────────────────────────────

function AboutSection({ locale, content }: { locale: Locale; content: SiteContent }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const t = messages[locale];
  const f = fixedMessages[locale];
  const [detailOpen, setDetailOpen] = useState(false);
  const mobile = useMobileViewport();
  const editor = useContext(InlineEditContext);
  const showAboutVisual = Boolean(contentUrl(content.aboutImageUrl, "") || editor.editing);

  return (
    <section ref={ref} className="py-32 md:py-44 bg-black relative overflow-hidden">
      <motion.div initial={{ scaleX: 0 }} animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 right-0 h-px origin-left"
        style={{ background: "#E01020" }} />

      <div className="max-w-7xl mx-auto px-6">
        <div className={`grid gap-16 md:gap-24 items-center ${showAboutVisual ? "md:grid-cols-2" : "mx-auto max-w-3xl"}`}>
          {/* Image */}
          {showAboutVisual && <motion.div initial={mobile ? false : { opacity: 0, scale: 0.93, x: -40 }}
            animate={isInView ? { opacity: 1, scale: 1, x: 0 } : {}}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-sm relative bg-neutral-900">
              <EditableImage
                k="aboutImageUrl"
                alt="About visual"
                className="w-full h-full object-cover"
                style={{ filter: "grayscale(25%) contrast(1.12) brightness(0.8)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-red-950/60 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
              {/* Red corner square */}
              <div className="absolute bottom-5 right-5 border border-red-600/50 w-12 h-12" />
            </div>
            <motion.div initial={{ scale: 0 }} animate={isInView ? { scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute -top-4 -right-4 w-8 h-8 rounded-full"
              style={{ background: "#E01020" }} />
          </motion.div>}

          {/* Text */}
          <div>
            <motion.span initial={mobile ? false : { opacity: 0, x: 20 }} animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xs tracking-[0.4em] uppercase font-medium" style={{ color: "#E01020" }}>
              {t.storyLabel}
            </motion.span>

            <div className="overflow-hidden mt-4 mb-8">
              <motion.h2 initial={mobile ? false : { y: 80 }} animate={isInView ? { y: 0 } : {}}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-white font-black leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.5rem, 8vw, 7rem)" }}>
                BABY<br /><span style={{ color: "#E01020" }}>MONSTER</span>
              </motion.h2>
            </div>

            <motion.p initial={mobile ? false : { opacity: 0, y: 28 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-white/60 leading-relaxed text-sm md:text-base mb-5">
              <EditableText k="storyLead" fallback={contentText(content.storyLead, t.storyLead)} />
            </motion.p>

            <motion.p initial={mobile ? false : { opacity: 0, y: 28 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.52 }}
              className="text-white/40 leading-relaxed text-sm mb-12">
              <EditableText k="storyBody" fallback={contentText(content.storyBody, t.storyBody)} />
            </motion.p>

            <motion.div initial={mobile ? false : { opacity: 0, y: 28 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.66 }}
              className="grid grid-cols-4 gap-4">
              {[
                { v: "2024.04", l: t.debut },
                { v: "YG", l: t.agency },
                { v: "7", l: t.membersLabel },
                { v: "3", l: t.nationalities },
              ].map(({ v, l }) => (
                <div key={l} className="border-l-2 pl-3" style={{ borderColor: "#E01020" }}>
                  <div className="text-white font-black text-xl md:text-2xl leading-tight"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{v}</div>
                  <div className="text-white/35 text-xs tracking-wider uppercase mt-1">{l}</div>
                </div>
              ))}
            </motion.div>
            <button onClick={() => setDetailOpen(true)} className="mt-8 text-red-400/80 hover:text-red-300 text-xs tracking-[0.25em] uppercase">{f.detailIntro}</button>
          </div>
        </div>
      </div>
      {detailOpen && <DetailModal title="BABYMONSTER" textKey="groupDetail" fallback={t.storyBody} onClose={() => setDetailOpen(false)} />}
    </section>
  );
}

// ─────────────────────────────────────────────
// MEMBER SPOTLIGHT (individual)
// ─────────────────────────────────────────────

function MemberSpotlight({ member, index, photoUrl, locale, instagramPosts = [] }: { member: typeof MEMBERS[0]; index: number; photoUrl?: string; locale: Locale; instagramPosts?: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });
  const isEven = index % 2 === 0;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const visualScale = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [0.82, 1, 1.04, 1.12]);
  const visualOpacity = useTransform(scrollYProgress, [0, 0.16, 0.8, 1], [0, 1, 1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [110, 0, 0, -90]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.2, 0.82, 1], [0, 1, 1, 0]);
  const progressX = useTransform(scrollYProgress, [0.12, 0.88], [0, 1]);
  const [detailOpen, setDetailOpen] = useState(false);
  const f = fixedMessages[locale];
  const reduceMotion = useReducedMotion();
  const mobile = useMobileViewport();
  const disableCinematicMotion = Boolean(reduceMotion || mobile);
  const nationality = member.nationality === "Japan" ? f.countryJapan : member.nationality === "Korea" ? f.countryKorea : f.countryThailand;
  const memberBirthDates: Record<string, string> = { ruka: "2002-03-20", pharita: "2005-08-26", asa: "2006-04-17", ahyeon: "2007-04-11", rami: "2007-10-17", rora: "2008-08-14", chiquita: "2009-02-17" };
  const birthDate = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${memberBirthDates[member.id]}T00:00:00Z`));

  return (
    <div ref={ref} className="cinematic-member min-h-[145vh] md:min-h-[175vh] relative overflow-clip border-t border-white/5">
      <motion.div className="sticky top-16 z-20 h-[2px] origin-left bg-[#E01020]" style={{ scaleX: progressX }} />
      {/* Number watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" aria-hidden>
        <span className="font-black text-white/[0.025] leading-none"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(10rem, 28vw, 26rem)" }}>
          {member.num}
        </span>
      </div>

      {/* Ambient glow */}
      <div className={`absolute top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none ${isEven ? "-right-48" : "-left-48"}`}
        style={{ background: `${member.accent}12` }} />

      <div className="cinematic-frame sticky top-0 min-h-screen max-w-7xl mx-auto px-5 sm:px-6 w-full flex items-center py-20">
        <div className={`grid md:grid-cols-2 gap-12 md:gap-20 items-center ${!isEven ? "md:[grid-template-areas:'info_photo']" : ""}`}>
          {/* Portrait */}
          <motion.div style={disableCinematicMotion ? undefined : { scale: visualScale, opacity: visualOpacity }}
            className={!isEven ? "md:order-last" : ""}>
            <div className="aspect-[3/4] max-w-sm mx-auto relative overflow-hidden rounded-sm bg-neutral-900 group">
              <EditableImage
                k={`memberPhotos.${member.id}`}
                alt={`${member.name}`}
                className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
                style={{ filter: "contrast(1.08) brightness(0.88)" }}
              />
              {/* Red color grade overlay */}
              <div className="absolute inset-0 opacity-45 mix-blend-multiply"
                style={{ background: `linear-gradient(145deg, ${member.accent}55 0%, transparent 55%)` }} />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="text-white/60 text-xs tracking-[0.3em] uppercase mb-1">{member.flag} {nationality}</div>
                <div className="text-white font-black text-4xl leading-none"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{member.name}</div>
              </div>

              {/* Corner accent */}
              <motion.div initial={{ scaleX: 0, originX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="absolute top-0 left-0 h-0.5 w-12"
                style={{ background: member.accent }} />
              <motion.div initial={{ scaleY: 0, originY: 0 }}
                animate={isInView ? { scaleY: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="absolute top-0 left-0 w-0.5 h-12"
                style={{ background: member.accent }} />
            </div>
          </motion.div>

          {/* Info */}
          <motion.div style={disableCinematicMotion ? undefined : { y: copyY, opacity: copyOpacity }}>
            {/* Index + divider */}
            <motion.div initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-3 mb-6">
              <span className="font-black text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: member.accent }}>
                {member.num}
              </span>
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-white/25 text-xs tracking-widest uppercase">{nationality}</span>
            </motion.div>

            {/* Name reveal */}
            <div className="overflow-hidden mb-3">
              <motion.h2 initial={{ y: "105%" }} animate={isInView ? { y: 0 } : {}}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
                className="text-white font-black leading-[0.88]"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.2rem, 8vw, 7.5rem)" }}>
                {member.name}
              </motion.h2>
            </div>

            {/* Hangul + birth */}
            <motion.div initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.38 }}
              className="flex items-center gap-4 mb-7">
              <span className="text-white/40 text-sm tracking-wider">{birthDate}</span>
            </motion.div>

            {/* Description */}
            <motion.p initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.58 }}
              className="text-white/55 leading-relaxed text-sm md:text-base mb-8">
              <EditableText k={`member.${member.id}.bio`} fallback={localizedMemberBio(member.name, member.nationality, locale)} />
            </motion.p>
            <button onClick={() => setDetailOpen(true)} className="text-red-400/80 hover:text-red-300 text-xs tracking-[0.25em] uppercase">{f.detailIntro}</button>

            {instagramPosts.length > 0 && <div className="mt-8 flex gap-4 overflow-x-auto pb-3">
              {instagramPosts.map((url, postIndex) => <div key={`${member.id}-${url}`} className="w-[280px] shrink-0 border border-white/10 bg-white p-1 sm:w-[320px]">
                <InstagramEmbedFrame url={url} index={postIndex} label={f.openInstagramPost} />
              </div>)}
            </div>}

          </motion.div>
        </div>
      </div>
      {detailOpen && <DetailModal title={member.name} textKey={`member.${member.id}.detail`} fallback={localizedMemberBio(member.name, member.nationality, locale, true)} onClose={() => setDetailOpen(false)} />}
    </div>
  );
}

function MembersSection({ locale, content }: { locale: Locale; content: SiteContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const t = messages[locale];
  const memberInstagramPosts = normalizeMemberInstagramPosts(content.instagramPosts);

  return (
    <section id="members" className="bg-black">
      <div ref={ref} className="py-24 md:py-32 text-center relative overflow-hidden">
        <motion.div initial={{ scaleX: 0 }} animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 left-0 right-0 h-px origin-left"
          style={{ background: "#E01020" }} />

        <motion.span initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="text-xs tracking-[0.4em] uppercase" style={{ color: "#E01020" }}>
          {t.membersLabel}
        </motion.span>

        <div className="overflow-hidden mt-4">
          <motion.h2 initial={{ y: 90 }} animate={isInView ? { y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
            className="text-white font-black leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(4rem, 12vw, 11rem)" }}>
            BABY<br /><span style={{ color: "#E01020" }}>MONSTER</span>
          </motion.h2>
        </div>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="text-white/35 text-sm tracking-widest mt-6">
          {t.membersLead}
        </motion.p>
      </div>

      {MEMBERS.map((m, i) => <MemberSpotlight key={m.id} member={m} index={i} photoUrl={content.memberPhotos?.[m.id]} locale={locale} instagramPosts={memberInstagramPosts[m.id]} />)}
    </section>
  );
}

// ─────────────────────────────────────────────
// ALBUM CARD
// ─────────────────────────────────────────────

function AlbumCard({ album, index, isVisible, locale }: { album: SpotifyRelease; index: number; isVisible: boolean; locale: Locale }) {
  const [expanded, setExpanded] = useState(false);
  const f = fixedMessages[locale];
  const trackNames = normalizeTrackNames(album.tracks);
  const visibleTracks = expanded ? trackNames : trackNames.slice(0, 5);
  const hasMoreTracks = trackNames.length > visibleTracks.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.85, delay: 0.2 + index * 0.13, ease: [0.16, 1, 0.3, 1] }}
      className="group cursor-pointer h-full"
      onClick={() => setExpanded(!expanded)}>
      <div className="relative aspect-square overflow-hidden rounded-sm mb-5 bg-neutral-900">
        {album.imageUrl && <img src={album.imageUrl} alt={album.title} className="w-full h-full object-cover transition-all duration-[1200ms] group-hover:scale-105" style={{ filter: "contrast(1.08) brightness(0.78)" }} />}
        {!album.imageUrl && <div className="w-full h-full grid place-items-center text-white/20 text-xs tracking-[0.25em] uppercase">{f.spotifyImage}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute inset-0 border border-transparent group-hover:border-red-600/40 transition-colors duration-300 rounded-sm" />

        {/* Play/expand icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(224,16,32,0.88)" }}>
            <Disc3 size={28} className="text-white" />
          </div>
        </div>

        <div className="absolute top-4 right-4 text-white/45 text-xs tracking-widest">{album.year}</div>
      </div>

      <div className="text-white font-black text-3xl leading-none mb-2 transition-colors duration-300 group-hover:text-red-400"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        {album.title}
      </div>
      <EditableText k={`album.${album.id}.lead`} fallback="" as="div" className="text-white/40 text-sm leading-relaxed" />

      {/* Track list */}
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
        className="mt-5 border-t border-white/8 pt-4 overflow-hidden">
        {visibleTracks.length > 0 ? (
          visibleTracks.map((trackName, ti) => (
            <a key={`${trackName}-${ti}`}
              href={youtubeTrackUrl(trackName)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              aria-label={`Play ${trackName} on YouTube`}
              className="flex items-center gap-3 py-2 text-white/45 hover:text-white transition-colors duration-200 group/t">
              <span className="text-xs text-white/20 w-4 text-right shrink-0">{ti + 1}</span>
              <Music size={11} style={{ color: "#E01020", opacity: 0.6 }} />
              <span className="text-sm tracking-wide flex-1">{trackName}</span>
              <Play size={11} className="text-red-600 opacity-0 group-hover/t:opacity-100 transition-opacity shrink-0" />
            </a>
          ))
        ) : (
          <p className="text-white/28 text-sm leading-relaxed">{f.trackListMissing}</p>
        )}
        {hasMoreTracks && (
          <button type="button" onClick={(event) => { event.stopPropagation(); setExpanded(true); }}
            className="mt-3 text-red-300/75 hover:text-red-200 text-xs tracking-[0.2em] uppercase">
            {f.showAllSongs}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

function MusicSection({ locale, content }: { locale: Locale; content: SiteContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const t = messages[locale];
  const f = fixedMessages[locale];
  const [spotifyAlbums, setSpotifyAlbums] = useState<SpotifyRelease[]>([]);
  const [spotifyStatus, setSpotifyStatus] = useState("");
  const editor = useContext(InlineEditContext);
  const albums = Array.isArray(content.albums) && content.albums.length ? content.albums : spotifyAlbums;

  useEffect(() => {
    if (Array.isArray(content.albums) && content.albums.length) return;
    if (!isInView) return;
    void fetchSpotifyReleaseStatus()
      .then(result => { setSpotifyAlbums(result.releases); setSpotifyStatus(result.error || (result.releases.length ? "" : "NO_SPOTIFY_RELEASES")); })
      .catch(error => { setSpotifyAlbums([]); setSpotifyStatus(error instanceof Error ? error.message : "SPOTIFY_UNAVAILABLE"); });
  }, [content.albums, isInView]);

  return (
    <section id="music" className="bg-black py-24 md:py-44 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={ref} className="mb-20">
          <motion.span initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}
            className="text-xs tracking-[0.4em] uppercase" style={{ color: "#E01020" }}>
            <EditableText k="musicKicker" fallback={t.streamsLabel} />
          </motion.span>
          <div className="overflow-hidden mt-4">
            <motion.h2 initial={{ y: 80 }} animate={isInView ? { y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-black leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.5rem, 10vw, 9rem)" }}>
              <EditableText k="musicHeading" fallback="BABYMONSTER MUSIC" />
            </motion.h2>
          </div>
        </div>

        {albums.length > 0 && <div className="album-marquee-viewport" aria-label="BABYMONSTER releases">
          <div className="album-marquee-track" style={{ animationDuration: `${Math.max(30, albums.length * 8)}s` }}>
            {[...albums, ...albums].map((a, i) => <div key={`${a.id || a.title}-${i}`} className="album-marquee-item">
              <AlbumCard album={a} index={i % albums.length} isVisible={isInView} locale={locale} />
            </div>)}
          </div>
        </div>}
        {albums.length === 0 && spotifyStatus && <div className="border border-white/8 bg-white/[0.018] p-6 text-white/45 text-sm leading-relaxed">
          <p className="text-white/65 mb-2">{f.spotifyUnavailableTitle}</p>
          <p>{f.statusLabel}: <code className="text-red-300">{spotifyStatus}</code>. {f.spotifyUnavailableHelp}</p>
          <a href="https://open.spotify.com/artist/1SIocsqdEefUTE6XKGUiVS" target="_blank" rel="noreferrer" className="inline-flex mt-4 items-center gap-2 text-red-300 hover:text-red-200 text-xs tracking-[0.25em] uppercase">{f.openSpotifyDiscography}<ExternalLink size={12} aria-hidden="true" /></a>
        </div>}

        <div className="grid md:grid-cols-[minmax(0,1.4fr)_minmax(260px,.6fr)] items-stretch gap-8 mt-16">
          <div className="spotify-player-shell border border-white/8 rounded-sm p-3" style={{ background: "rgba(255,255,255,0.018)" }}>
            <iframe title="BABYMONSTER on Spotify" className="spotify-player w-full rounded-sm" src="https://open.spotify.com/embed/artist/1SIocsqdEefUTE6XKGUiVS?utm_source=generator&theme=0" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
          </div>
          <div className="grid gap-4">
            <a href="https://www.youtube.com/@BABYMONSTER" target="_blank" rel="noreferrer" className="border border-white/8 rounded-sm p-6 flex flex-col justify-between hover:border-red-600/30 transition-colors">
              <span className="text-white/35 text-xs tracking-[.3em] uppercase"><EditableText k="youtubeLabel" fallback={t.officialChannel} /></span><strong className="inline-flex items-center gap-2 text-white text-3xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>YOUTUBE<ExternalLink size={20} aria-hidden="true" /></strong>
            </a>
            <a href="https://www.instagram.com/babymonster_ygofficial/" target="_blank" rel="noreferrer" className="border border-white/8 rounded-sm p-6 flex flex-col justify-between hover:border-red-600/30 transition-colors">
              <span className="text-white/35 text-xs tracking-[.3em] uppercase"><EditableText k="instagramLabel" fallback={t.officialProfile} /></span><strong className="inline-flex items-center gap-2 text-white text-3xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>INSTAGRAM<ExternalLink size={20} aria-hidden="true" /></strong>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// EVENT CARD
// ─────────────────────────────────────────────

function eventStatusLabel(status: EditableEvent["status"], locale: Locale) {
  const labels: Record<Locale, Record<EditableEvent["status"], string>> = {
    "zh-TW": { past: "過去", upcoming: "即將舉行", future: "未來" },
    "zh-CN": { past: "过去", upcoming: "即将举行", future: "未来" },
    th: { past: "ที่ผ่านมา", upcoming: "เร็ว ๆ นี้", future: "อนาคต" },
    en: { past: "Past", upcoming: "Upcoming", future: "Future" },
    ko: { past: "지난 일정", upcoming: "곧 예정", future: "향후 일정" },
    ja: { past: "終了", upcoming: "近日開催", future: "今後" },
  };
  return labels[locale][status];
}

function localizedEvent(event: EditableEvent, locale: Locale): EditableEvent {
  if (!/CHOOM/i.test(event.title) || !/World Tour/i.test(event.type || event.title)) return event;
  const f = fixedMessages[locale];
  return { ...event, type: f.eventWorldTour, desc: f.eventInCity(event.sub || event.locations) };
}

function eventDateTimestamp(event: EditableEvent, boundary: "start" | "end" = "start") {
  const fallback = event.dates.match(/\d{4}[.-]\d{2}[.-]\d{2}/)?.[0]?.replaceAll(".", "-") || "";
  const source = boundary === "end" ? event.endDate || event.startDate || fallback : event.startDate || fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source)) return Number.POSITIVE_INFINITY;
  const [year, month, day] = source.split("-").map(Number);
  return new Date(year, month - 1, day).setHours(0, 0, 0, 0);
}

function eventDisplayDate(event: EditableEvent) {
  const start = event.startDate;
  const end = event.endDate || start;
  if (!start) return event.dates || "TBA";
  const dottedStart = start.replaceAll("-", ".");
  if (!end || end === start) return dottedStart;
  const [startYear] = start.split("-");
  const [endYear, endMonth, endDay] = end.split("-");
  return startYear === endYear ? `${dottedStart}–${endMonth}.${endDay}` : `${dottedStart}–${end.replaceAll("-", ".")}`;
}

function classifyEventsByDate(events: EditableEvent[], now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dated = events.map((event, index) => ({ event, index, timestamp: eventDateTimestamp(event), endTimestamp: eventDateTimestamp(event, "end") }));
  const next = dated
    .filter(item => item.endTimestamp >= today)
    .sort((a, b) => a.timestamp - b.timestamp || a.index - b.index)[0];

  return dated.map(item => ({
    ...item.event,
    dates: eventDisplayDate(item.event),
    status: item.endTimestamp < today ? "past" : item.index === next?.index ? "upcoming" : "future",
  } as EditableEvent));
}

function EventCard({ event, index, locale, onOpen }: { event: EditableEvent; index: number; locale: Locale; onOpen: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const isLeft = index % 2 === 0;
  const t = messages[locale];
  const displayEvent = localizedEvent(event, locale);
  const localizedTitle = [
    `BABYMONSTER — ${t.eventsLabel}`,
    `SPOTIFY · YOUTUBE — ${t.streamsLabel}`,
    `YG — ${t.latestNews}`,
    `MONSTIEZ — ${t.communityLabel}`,
  ][index];

  return (
    <div ref={ref} className={`relative pl-12 md:pl-0 ${isLeft ? "md:pr-[52%]" : "md:pl-[52%]"}`}>
      {/* Timeline dot */}
      <motion.div initial={{ scale: 0 }} animate={isInView ? { scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="absolute left-0 md:left-1/2 top-8 -translate-x-1/2">
        <div className={`w-3 h-3 rounded-full ${event.status === "past" ? "bg-white/20" : ""}`}
          style={event.status !== "past" ? { background: "#E01020" } : {}} />
        {event.status === "upcoming" && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: "#E01020" }} />
        )}
      </motion.div>

      <motion.div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={eventKey => { if (eventKey.key === "Enter" || eventKey.key === " ") onOpen(); }}
        initial={{ opacity: 0, y: 38, x: isLeft ? -24 : 24 }}
        animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className={`cursor-pointer border border-white/8 rounded-sm p-6 hover:border-red-600/25 transition-colors duration-300 group ${isLeft ? "md:mr-8" : "md:ml-8"}`}
        style={{ background: "rgba(255,255,255,0.018)" }}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <span className={`text-xs tracking-[0.3em] uppercase px-2 py-0.5 rounded ${
            event.status !== "past"
              ? "text-red-400 border border-red-800/30"
              : "text-white/30 bg-white/5"
          }`}
            style={event.status !== "past" ? { background: "rgba(224,16,32,0.1)" } : {}}>
            {eventStatusLabel(event.status, locale)}
          </span>
          <span className="text-white/25 text-xs tracking-wider">{messages[locale].eventsLabel}</span>
        </div>

        <h3 className="text-white font-black text-2xl md:text-3xl leading-tight mb-1 group-hover:text-red-400 transition-colors duration-300"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {contentText(displayEvent.title, localizedTitle)}
        </h3>
        <p className="text-white/35 text-xs tracking-widest uppercase mb-4">{contentText(displayEvent.sub, t.verifyOfficial)}</p>
        <div className="flex flex-wrap gap-5 text-xs text-white/35">
          <span className="flex items-center gap-1.5">
            <Calendar size={11} style={{ color: "rgba(224,16,32,0.6)" }} />
            {eventDisplayDate(event)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={11} style={{ color: "rgba(224,16,32,0.6)" }} />
            {displayEvent.locations}
          </span>
        </div>
        <span className="mt-5 inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-red-300/80">{fixedMessages[locale].detailIntro}<ExternalLink size={12} aria-hidden="true" /></span>
      </motion.div>
    </div>
  );
}

function EventsSection({ locale, content }: { locale: Locale; content: SiteContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const t = messages[locale];
  const events = classifyEventsByDate(Array.isArray(content.events) ? content.events : []);
  const [selectedEvent, setSelectedEvent] = useState<EditableEvent | null>(null);
  const [allEventsOpen, setAllEventsOpen] = useState(false);
  const visibleEvents = [
    events.filter(event => event.status === "past").sort((a, b) => eventDateTimestamp(b) - eventDateTimestamp(a))[0],
    events.find(event => event.status === "upcoming"),
    events.filter(event => event.status === "future").sort((a, b) => eventDateTimestamp(a) - eventDateTimestamp(b))[0],
  ].filter((event): event is EditableEvent => Boolean(event));

  return (
    <section id="events" className="bg-black py-24 md:py-44 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={ref} className="mb-20">
          <motion.span initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}
            className="text-xs tracking-[0.4em] uppercase" style={{ color: "#E01020" }}>
            <EditableText k="eventsKicker" fallback={t.eventsLabel} />
          </motion.span>
          <div className="overflow-hidden mt-4">
            <motion.h2 initial={{ y: 80 }} animate={isInView ? { y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-black leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.5rem, 10vw, 9rem)" }}>
              <EditableText k="eventsHeading" fallback={`BABYMONSTER ${t.eventsLabel}`} />
            </motion.h2>
          </div>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-white/8" />
          <div className="space-y-14">
            {visibleEvents.map((event, index) => <EventCard key={event.id ?? `${event.status}-${index}`} event={event} index={index} locale={locale} onOpen={() => setSelectedEvent(event)} />)}
          </div>
        </div>
        {events.length > 0 && <div className="mt-12 text-center">
          <button onClick={() => setAllEventsOpen(true)} className="border border-red-500/35 px-6 py-3 text-xs tracking-[0.22em] uppercase text-red-300 transition hover:bg-red-600/10">
            {fixedMessages[locale].viewAllEvents}
          </button>
        </div>}
      </div>
      {allEventsOpen && <AllEventsModal events={events} locale={locale} onSelect={event => { setAllEventsOpen(false); setSelectedEvent(event); }} onClose={() => setAllEventsOpen(false)} />}
      {selectedEvent && <EventDetailModal event={selectedEvent} locale={locale} onClose={() => setSelectedEvent(null)} />}
    </section>
  );
}

function AllEventsModal({ events, locale, onSelect, onClose }: { events: EditableEvent[]; locale: Locale; onSelect: (event: EditableEvent) => void; onClose: () => void }) {
  const sortedEvents = [...events].sort((a, b) => eventDateTimestamp(a) - eventDateTimestamp(b));
  const f = fixedMessages[locale];
  return <div className="fixed inset-0 z-[115] grid place-items-center bg-black/88 p-5" role="dialog" aria-modal="true" aria-label={f.allEventsTitle}>
    <div className="w-full max-w-4xl max-h-[88vh] overflow-auto border border-white/15 bg-[#090909] p-6 shadow-2xl md:p-8">
      <div className="mb-6 flex items-start justify-between gap-5">
        <h2 className="text-4xl font-black leading-none text-white md:text-5xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{f.allEventsTitle}</h2>
        <button onClick={onClose} className="text-white/50 hover:text-white" aria-label={f.closeDialog}><X size={22} aria-hidden="true" /></button>
      </div>
      <div className="grid gap-3">
        {sortedEvents.map(event => { const displayEvent = localizedEvent(event, locale); return <button key={event.id ?? `${event.sub}-${event.startDate}`} onClick={() => onSelect(event)} className="grid gap-2 border border-white/10 p-4 text-left transition hover:border-red-500/40 md:grid-cols-[150px_1fr_auto] md:items-center">
          <span className="text-sm text-red-300">{eventDisplayDate(event)}</span>
          <span><strong className="block text-lg text-white">{displayEvent.sub || displayEvent.title}</strong><span className="text-xs text-white/40">{displayEvent.locations}</span></span>
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-white/35">{eventStatusLabel(event.status, locale)}<ExternalLink size={12} aria-hidden="true" /></span>
        </button>; })}
      </div>
    </div>
  </div>;
}

function EventDetailModal({ event, locale, onClose }: { event: EditableEvent; locale: Locale; onClose: () => void }) {
  const f = fixedMessages[locale];
  const displayEvent = localizedEvent(event, locale);
  return <div className="fixed inset-0 z-[115] grid place-items-center bg-black/88 p-5" role="dialog" aria-modal="true" aria-label={event.title}>
    <div className="w-full max-w-3xl max-h-[86vh] overflow-auto border border-white/15 bg-[#090909] p-7 shadow-2xl">
      <div className="mb-6 flex items-start justify-between gap-5">
        <div>
          <span className="text-xs tracking-[0.25em] uppercase text-red-400">{eventStatusLabel(event.status, locale)}</span>
          <h2 className="mt-2 text-4xl font-black leading-none text-white md:text-5xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{displayEvent.title}</h2>
          {displayEvent.sub && <p className="mt-3 text-xs tracking-widest uppercase text-white/40">{displayEvent.sub}</p>}
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white" aria-label={f.closeDialog}><X size={22} aria-hidden="true" /></button>
      </div>
      <div className="mb-6 flex flex-wrap gap-5 text-sm text-white/45">
        <span className="flex items-center gap-2"><Calendar size={14} className="text-red-400" />{eventDisplayDate(event)}</span>
        <span className="flex items-center gap-2"><MapPin size={14} className="text-red-400" />{displayEvent.locations}</span>
        {displayEvent.type && <span>{displayEvent.type}</span>}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-7 text-white/65">{displayEvent.desc}</p>
    </div>
  </div>;
}

// ─────────────────────────────────────────────
// POST CARD
// ─────────────────────────────────────────────

function PostCard({
  post, index, onLike, onRefresh, user, locale,
}: {
  post: ApiPost; index: number; onLike: (post: ApiPost) => void; onRefresh: () => void;
  user: User | null; locale: Locale;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [copy, setCopy] = useState(post.body);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replies, setReplies] = useState<FanReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState("");
  const [reportFeedback, setReportFeedback] = useState("");
  const t = messages[locale];
  const actions = communityActions[locale];

  useEffect(() => {
    let active = true;
    if (post.sourceLanguage === locale || post.id < 0) { queueMicrotask(() => { if (active) setCopy(post.body); }); return () => { active = false; }; }
    translateFanPost(post.id, locale, post.body)
      .then(text => { if (active) setCopy(text); })
      .catch(() => { if (active) setCopy(post.body); });
    return () => { active = false; };
  }, [post.id, post.body, post.sourceLanguage, locale]);

  async function editPost() {
    const body = window.prompt(t.edit, post.body)?.trim();
    if (!body || body === post.body) return;
    try { await editFanPost(post.id, body); onRefresh(); } catch { /* RLS keeps unauthorized edits out */ }
  }
  async function removePost() {
    if (window.confirm(`${t.remove}?`)) try { await deleteFanPost(post.id); onRefresh(); } catch { /* RLS keeps unauthorized deletes out */ }
  }
  async function reportPost() {
    try { await reportFanPost(post.id); setReportFeedback(actions.reported); onRefresh(); }
    catch { setReportFeedback(actions.reportFailed); }
  }
  async function submitReply() {
    if (!user || !replyBody.trim() || replySubmitting) return;
    setReplySubmitting(true);
    setReplyFeedback("");
    try {
      await createFanReply(post.id, replyBody, locale);
      setReplyBody("");
      setReplyOpen(true);
      setReplies(await listFanReplies(post.id));
      setReplyFeedback(actions.replySaved);
      onRefresh();
    }
    catch (error) {
      const errorMessage = error && typeof error === "object" && "message" in error ? String(error.message || "") : "";
      const detail = errorMessage ? ` (${errorMessage})` : "";
      setReplyFeedback(`${actions.replyFailed}${detail}`);
    }
    finally { setReplySubmitting(false); }
  }
  async function toggleReplies() {
    const nextOpen = !replyOpen;
    setReplyOpen(nextOpen);
    if (nextOpen && !replies.length && post.comments > 0) {
      setRepliesLoading(true);
      try { setReplies(await listFanReplies(post.id)); } catch { setReplies([]); }
      finally { setRepliesLoading(false); }
    }
  }
  async function moderatePost() {
    try { await moderateFanPost(post.id); onRefresh(); } catch { /* RLS verifies admin role */ }
  }

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index < 4 ? index * 0.08 : 0, ease: [0.16, 1, 0.3, 1] }}
      className="border border-white/8 rounded-sm p-6 hover:border-white/15 transition-colors duration-300"
      style={{ background: "rgba(255,255,255,0.015)" }}>
      <div className="flex items-start gap-4">
        <div className="relative w-9 h-9 shrink-0">
          <div className="h-full w-full rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: ["#E01020", "#cc0000", "#b30000", "#ff2d2d"][Math.abs(post.id) % 4] }}>
            {post.nickname.slice(0, 2).toUpperCase()}
          </div>
          {post.role !== "monstiez" && <VerificationBadge role={post.role} label={post.role === "admin" ? t.roleAdmin : t.roleArtist} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium text-sm">{post.nickname}</span>
            <span className="text-white/22 text-xs">{post.createdAt} · {post.sourceLanguage}</span>
          </div>
          <p className="text-white/62 text-sm leading-relaxed">{copy}</p>
          <div className="flex flex-wrap items-center gap-5 mt-4">
            <button onClick={() => onLike(post)}
              className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                post.liked ? "text-red-500" : "text-white/28 hover:text-white/60"
              }`}>
              <Heart size={13} fill={post.liked ? "currentColor" : "none"} />
              {post.likes}
            </button>
            <button onClick={() => void toggleReplies()} className="flex items-center gap-1.5 text-xs text-white/28 hover:text-white/55 transition-colors duration-200">
              <MessageCircle size={13} />
              {post.comments} {actions.reply}
            </button>
            {post.canEdit && <button onClick={editPost} className="text-white/28 hover:text-white/60 text-xs">{t.edit}</button>}
            {post.canEdit && <button onClick={removePost} className="text-white/28 hover:text-red-400 text-xs">{t.remove}</button>}
            {user && post.id > 0 && <button onClick={reportPost} className="text-white/28 hover:text-white/60 text-xs">{t.report}</button>}
            {user?.role === "admin" && <button onClick={moderatePost} className="text-red-400/70 hover:text-red-300 text-xs">{t.moderate}</button>}
            {reportFeedback && <span className="text-white/35 text-xs" role="status">{reportFeedback}</span>}
          </div>
          {replyOpen && <div className="mt-5 border-l border-white/10 pl-4">
            <div className="space-y-3">
              {replies.map(reply => <div key={reply.id} className="border-t border-white/6 pt-3 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-white/65 font-medium">{reply.nickname}</span>
                  {reply.role !== "monstiez" && <span className={reply.role === "admin" ? "text-red-400/70" : "text-blue-400/70"}>{reply.role === "admin" ? t.roleAdmin : t.roleArtist}</span>}
                  <span className="text-white/20">{reply.createdAt}</span>
                </div>
                <p className="mt-1.5 text-white/50 text-sm leading-relaxed whitespace-pre-wrap">{reply.body}</p>
              </div>)}
              {repliesLoading && <p className="text-white/25 text-xs">…</p>}
              {!repliesLoading && !replies.length && <p className="text-white/25 text-xs">{t.replies}: 0</p>}
            </div>
            {user ? <div className="mt-4 flex items-end gap-2">
              <textarea value={replyBody} onChange={event => setReplyBody(event.target.value)} maxLength={500} rows={2}
                placeholder={actions.replyPlaceholder}
                className="min-h-16 flex-1 resize-none border border-white/10 bg-transparent p-3 text-sm text-white/70 placeholder:text-white/20 focus:border-red-500/40 focus:outline-none"
                onKeyDown={event => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void submitReply(); }} />
              <button onClick={() => void submitReply()} disabled={!replyBody.trim() || replySubmitting}
                className="min-h-11 shrink-0 bg-[#E01020] px-4 text-xs text-white disabled:opacity-35">{replySubmitting ? "…" : actions.sendReply}</button>
            </div> : <p className="mt-4 text-white/25 text-xs">{t.signInToJoin}</p>}
            {replyFeedback && <p className="mt-2 text-xs text-white/40" role="status">{replyFeedback}</p>}
          </div>}
        </div>
      </div>
    </motion.div>
  );
}

function CommunitySection({ user, locale, onLogin }: { user: User | null; locale: Locale; onLogin: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.12 });
  const [posts, setPosts] = useState<ApiPost[]>(EMPTY_POSTS);
  const [body, setBody] = useState("");
  const [allOpen, setAllOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const t = messages[locale];
  const f = fixedMessages[locale];

  const refresh = useCallback(() => {
    listFanPosts(user).then(data => setPosts(data)).catch(() => setPosts(EMPTY_POSTS));
  }, [user]);

  useEffect(() => { refresh(); const timer = window.setInterval(refresh, 30_000); return () => window.clearInterval(timer); }, [refresh]);

  const handleLike = async (post: ApiPost) => {
    if (!user) { onLogin(); return; }
    if (post.id < 0) return;
    setPosts(items => items.map(item => item.id === post.id ? { ...item, likes: item.likes + (item.liked ? -1 : 1), liked: !item.liked } : item));
    try {
      await toggleFanLike(post.id, post.liked);
    } catch {
      setPosts(items => items.map(item => item.id === post.id ? { ...item, likes: item.likes + (post.liked ? 1 : -1), liked: post.liked } : item));
    }
  };

  const submit = async () => {
    if (!user) { onLogin(); return; }
    if (!body.trim()) return;
    if (submitting) return;
    setSubmitting(true);
    try { await createFanPost(body.trim(), locale); setBody(""); refresh(); }
    catch { /* input remains available for retry */ }
    finally { setSubmitting(false); }
  };

  return (
    <section id="community" className="bg-black py-24 md:py-44 border-t border-white/5">
      <div className="max-w-3xl mx-auto px-6">
        <div ref={ref} className="mb-16">
          <motion.span initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}
            className="text-xs tracking-[0.4em] uppercase" style={{ color: "#E01020" }}>
            <EditableText k="communityKicker" fallback={t.communityLabel} />
          </motion.span>
          <div className="overflow-hidden mt-4">
            <motion.h2 initial={{ y: 80 }} animate={isInView ? { y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-black leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.5rem, 10vw, 9rem)" }}>
              <EditableText k="communityHeading" fallback={`MONSTIEZ ${t.communityTitle}`} />
            </motion.h2>
          </div>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.42 }}
            className="text-white/35 text-sm mt-5 tracking-wide">
            <EditableText k="communityLead" fallback={t.communityLead} />
          </motion.p>
        </div>

        {/* Post form */}
        <motion.div initial={{ opacity: 0, y: 28 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.52, duration: 0.7 }}
          className="mb-10 border border-white/10 rounded-sm p-6 hover:border-red-600/20 transition-colors duration-300"
          style={{ background: "rgba(255,255,255,0.02)" }}>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={3}
            placeholder={user ? `${user.nickname}，${t.composeUser}` : t.composeGuest}
            disabled={!user}
            className="w-full bg-transparent text-white/75 text-sm placeholder-white/18 resize-none focus:outline-none py-2"
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit(); }} />
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/6">
            <span className="text-white/18 text-xs">{user ? "⌘ / Ctrl + Enter" : t.signInToJoin}</span>
            <button onClick={() => void submit()} disabled={submitting || (Boolean(user) && !body.trim())}
              className="flex items-center gap-2 px-5 py-2 text-white text-xs tracking-widest uppercase font-medium transition-colors duration-200 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "#E01020" }}
              onMouseEnter={e => { if (body.trim()) (e.currentTarget as HTMLButtonElement).style.background = "#c00e1c"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#E01020"; }}>
              <Send size={12} /> {submitting ? "…" : user ? t.publish : t.login}
            </button>
          </div>
        </motion.div>

        {/* Posts */}
        <div className="mb-5 flex justify-end">
          <button onClick={() => setAllOpen(true)} className="text-red-400/80 hover:text-red-300 text-xs tracking-[0.25em] uppercase">{f.viewAllPosts}</button>
        </div>
        <div className="space-y-4">
          {posts.map((p, i) => <PostCard key={p.id} post={p} index={i} onLike={handleLike} onRefresh={refresh} user={user} locale={locale} />)}
        </div>
      </div>
      {allOpen && <AllPostsModal posts={posts} onLike={handleLike} onRefresh={refresh} user={user} locale={locale} onClose={() => setAllOpen(false)} />}
    </section>
  );
}

function AllPostsModal({ posts, onLike, onRefresh, user, locale, onClose }: {
  posts: ApiPost[]; onLike: (post: ApiPost) => void; onRefresh: () => void; user: User | null; locale: Locale; onClose: () => void;
}) {
  const f = fixedMessages[locale];
  return <div className="fixed inset-0 z-[112] bg-black/90 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={f.allPostsAria}>
    <div className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-[#090909] border border-white/15 p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-5 mb-6">
        <h2 className="text-white font-black text-5xl leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{f.boardTitle}</h2>
        <button onClick={onClose} className="text-white/50 hover:text-white" aria-label={f.closeDialog}><X size={22} aria-hidden="true" /></button>
      </div>
      <div className="space-y-4">
        {posts.map((post, index) => <PostCard key={post.id} post={post} index={index} onLike={onLike} onRefresh={onRefresh} user={user} locale={locale} />)}
        {!posts.length && <p className="text-white/35 text-sm">{f.emptyPosts}</p>}
      </div>
    </div>
  </div>;
}

function FanVoices({ locale, user }: { locale: Locale; user: User | null }) {
  const [posts, setPosts] = useState<ApiPost[]>(EMPTY_POSTS);
  useEffect(() => { void listFanPosts(user).then(rows => rows.length && setPosts(rows)).catch(() => {}); }, [user]);
  const loop = [...posts.slice(0, 6), ...posts.slice(0, 6)];
  if (!loop.length) return null;
  return <section className="voices-section" aria-labelledby="fan-voices-title">
    <div className="max-w-7xl mx-auto px-6"><p className="text-xs tracking-[0.4em] uppercase text-[#E01020]" id="fan-voices-title">{messages[locale].fanVoices}</p></div>
    <div className="voices-viewport"><div className="voices-track">{loop.map((post, index) => <blockquote key={`${post.id}-${index}`}><p>“{post.body}”</p><footer>{post.nickname} · {post.sourceLanguage}</footer></blockquote>)}</div></div>
  </section>;
}

function Announcements({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<Array<{ id: number; title: string; body: string; published_at: string }>>([]);
  const t = messages[locale];
  useEffect(() => { void listAnnouncements(locale).then(setItems).catch(() => setItems([])); }, [locale]);
  const rows = items;
  if (!rows.length) return null;
  return <section className="announcement-section"><div className="max-w-7xl mx-auto px-6"><p className="text-xs tracking-[0.4em] uppercase text-[#E01020]">{t.announcements}</p><div className="announcement-list">{rows.map(item => <article key={item.id}><time>{item.published_at.slice(0, 10)}</time><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></div></section>;
}

// ─────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────

function LegalModal({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  return <div className="fixed inset-0 z-[110] bg-black/88 grid place-items-center p-5" role="dialog" aria-modal="true" aria-label={title}>
    <div className="w-full max-w-3xl max-h-[86vh] overflow-auto bg-[#090909] border border-white/15 p-7 shadow-2xl">
      <div className="flex items-start justify-between gap-5 mb-6">
        <h2 className="text-white font-black text-4xl leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{title}</h2>
        <button onClick={onClose} className="text-white/50 hover:text-white" aria-label="Close"><X size={22} aria-hidden="true" /></button>
      </div>
      <div className="whitespace-pre-wrap text-white/58 text-sm leading-7">{body}</div>
    </div>
  </div>;
}

function DetailModal({ title, textKey, fallback, onClose }: { title: string; textKey: string; fallback?: string; onClose: () => void }) {
  const editor = useContext(InlineEditContext);
  const f = fixedMessages[editor.locale];
  return <div className="fixed inset-0 z-[115] bg-black/88 grid place-items-center p-5" role="dialog" aria-modal="true" aria-label={title}>
    <div className="w-full max-w-3xl max-h-[86vh] overflow-auto bg-[#090909] border border-white/15 p-7 shadow-2xl">
      <div className="flex items-start justify-between gap-5 mb-6">
        <h2 className="text-white font-black text-5xl leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{title}</h2>
        <button onClick={onClose} className="text-white/50 hover:text-white" aria-label={f.closeDialog}><X size={22} aria-hidden="true" /></button>
      </div>
      <EditableText k={textKey} fallback={fallback || ""} as="p" className="whitespace-pre-wrap text-white/58 text-sm leading-7" />
    </div>
  </div>;
}

function Footer({ locale, content }: { locale: Locale; content: SiteContent }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const t = messages[locale];
  const f = fixedMessages[locale];
  const links = [{ id: "members", label: t.nav[1] }, { id: "music", label: t.nav[2] }, { id: "events", label: t.nav[3] }, { id: "community", label: t.nav[4] }];
  const siteName = OFFICIAL_BRAND_NAME;

  return (
    <footer ref={ref} className="bg-black border-t border-white/8 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}>
            <div className="text-white font-black text-2xl mb-3 tracking-wider"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {siteName}
            </div>
            <p className="text-white/28 text-xs leading-relaxed">
              <EditableText k="siteTagline" fallback={contentText(content.siteTagline, t.heroKicker)} /><br />
              <EditableText k="heroNote" fallback={contentText(content.heroNote, t.heroNote)} />
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.18 }}>
            <div className="text-white/45 text-xs tracking-[0.3em] uppercase mb-4">{t.language}</div>
            <div className="space-y-2">
              {links.map(item => (
                <a key={item.id} href={`#${item.id}`}
                  className="block text-white/28 hover:text-white text-sm transition-colors duration-200">
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.26 }}>
            <div className="text-white/45 text-xs tracking-[0.3em] uppercase mb-4">MONSTIEZ</div>
            <EditableText k="footerDescription" fallback="" as="p" className="text-white/22 text-xs leading-relaxed" />
          </motion.div>
        </div>

        <div className="border-t border-white/5 pt-8 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-white/18 text-xs"><img src={FIXED_FAVICON_URL} alt="" aria-hidden="true" className="h-4 w-4 opacity-50" />&copy; 2026 {OFFICIAL_BRAND_NAME} · babymonster.fans</span>
          <div className="flex flex-wrap items-center justify-end gap-4">
            <a href={TERMS_OF_SERVICE_URL} className="text-white/28 hover:text-white text-xs tracking-widest">{f.termsOfService}</a>
            <a href={PRIVACY_POLICY_URL} className="text-white/28 hover:text-white text-xs tracking-widest">{f.privacyPolicy}</a>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#E01020" }} />
            <EditableText k="footerSignal" fallback="MONSTERS FOREVER" as="span" className="text-white/18 text-xs tracking-widest" />
          </div>
        </div>
        <EditableText k="footerLegalNoticeV3" fallback={t.warning} as="p" className="mt-8 pt-6 border-t border-white/5 text-white/25 text-xs leading-relaxed" />
      </div>
    </footer>
  );
}

function OpeningLoader({ locale }: { locale: Locale }) {
  const f = fixedMessages[locale];
  return <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeOut" } }}
    className="opening-loader fixed inset-0 z-[200] bg-black overflow-hidden grid place-items-center"
    role="status"
    aria-live="polite"
    aria-label={f.loadingAria}>
    <div className="opening-loader__glow absolute inset-0" />

    <div className="relative z-10 text-center px-6">
      <p className="opening-loader__signal text-white/35 text-xs tracking-[0.5em] uppercase mb-5">
        {f.loadingSignal}
      </p>
      <div className="overflow-hidden">
        <h1 className="opening-loader__title text-white font-black leading-[0.82]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.8rem, 14vw, 12rem)" }}>
          Monstiez
        </h1>
      </div>
      <div className="mt-9 h-1 w-56 mx-auto bg-white/10 overflow-hidden">
        <div className="opening-loader__bar h-full bg-[#E01020]" />
      </div>
      <div className="opening-loader__status mt-5 text-white/28 text-xs tracking-[0.35em] uppercase">
        {f.loadingStatus}
      </div>
    </div>
  </motion.div>;
}

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────

function AdminAccordion({ title, description, badge, children }: { title: string; description?: string; badge?: ReactNode; children: ReactNode }) {
  return <details className="admin-accordion group border-t border-white/8">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left">
      <div>
        <h3 className="text-white font-bold">{title}</h3>
        {description && <p className="mt-1 text-white/35 text-xs leading-relaxed">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {badge}
        <ChevronDown size={18} className="text-white/40 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
      </div>
    </summary>
    <div className="pb-6">{children}</div>
  </details>;
}

function AdminLocalizedTextFields({ baseKey, label, uiText, onChange, rows = 4 }: {
  baseKey: string; label: string; uiText: Record<string, string>; onChange: (key: string, value: string) => void; rows?: number;
}) {
  return <fieldset className="admin-language-fields border border-white/8 p-4">
    <legend className="px-2 text-xs font-bold tracking-wider text-white/65">{label}</legend>
    <div className="grid gap-3 md:grid-cols-2">
      {supportedLocales.map(item => <label key={item} className="block text-xs tracking-wider text-white/45">
        {localeLabels[item]}
        <textarea
          rows={rows}
          value={uiText[localizedTextKey(baseKey, item)] || ""}
          onChange={event => onChange(localizedTextKey(baseKey, item), event.target.value)}
          className="admin-language-input mt-2 w-full resize-y border border-white/15 bg-black p-3 text-sm leading-relaxed text-white/75 focus:border-red-600/60 focus:outline-none"
        />
      </label>)}
    </div>
  </fieldset>;
}

function initializeLocalizedIntroductions(content: SiteContent) {
  const uiText = { ...(content.uiText || {}) };
  const keys = ["storyLead", "storyBody", "groupDetail", ...MEMBERS.flatMap(member => [`member.${member.id}.bio`, `member.${member.id}.detail`])];
  for (const key of keys) {
    const legacyValue = contentText(uiText[key], key === "storyLead" ? contentText(content.storyLead, "") : key === "storyBody" ? contentText(content.storyBody, "") : "");
    for (const item of supportedLocales) {
      const localizedKey = localizedTextKey(key, item);
      if (typeof uiText[localizedKey] !== "string") uiText[localizedKey] = legacyValue;
    }
  }
  return uiText;
}

function AdminPanel({ content, onSaved, onClose }: { content: SiteContent; onSaved: (content: SiteContent) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<SiteContent>(() => ({
    ...content,
    siteName: OFFICIAL_BRAND_NAME,
    faviconUrl: FIXED_FAVICON_URL,
    siteTagline: contentText(content.siteTagline, DEFAULT_SITE_CONTENT.siteTagline),
    memberPhotos: { ...(content.memberPhotos || {}) },
    uiText: initializeLocalizedIntroductions(content),
    events: Array.isArray(content.events) ? content.events : [],
    albums: Array.isArray(content.albums) ? content.albums : [],
    instagramPosts: normalizeMemberInstagramPosts(content.instagramPosts),
  }));
  const [feedback, setFeedback] = useState("");
  const [nicknameBlacklist, setNicknameBlacklist] = useState<NicknameBlacklistEntry[]>([]);
  const [blacklistName, setBlacklistName] = useState("");
  const [moderationQueue, setModerationQueue] = useState<ModerationNotification[]>([]);

  useEffect(() => {
    let active = true;
    void listNicknameBlacklist()
      .then(entries => { if (active) setNicknameBlacklist(entries); })
      .catch(error => { if (active) setFeedback(error instanceof Error ? `暱稱黑名單載入失敗：${error.message}` : "暱稱黑名單載入失敗。"); });
    return () => { active = false; };
  }, []);

  const refreshModerationQueue = useCallback(() => {
    void listModerationNotifications()
      .then(setModerationQueue)
      .catch(error => setFeedback(error instanceof Error ? `審核通知載入失敗：${error.message}` : "審核通知載入失敗。"));
  }, []);

  useEffect(() => {
    refreshModerationQueue();
    const timer = window.setInterval(refreshModerationQueue, 30_000);
    return () => window.clearInterval(timer);
  }, [refreshModerationQueue]);

  async function reviewReportedPost(item: ModerationNotification, action: "restored" | "hidden") {
    setFeedback(action === "restored" ? "正在恢復貼文…" : "正在確認隱藏貼文…");
    try {
      await reviewModerationNotification(item.id, item.postId, action);
      setModerationQueue(current => current.filter(notification => notification.id !== item.id));
      setFeedback(action === "restored" ? "貼文已恢復公開。" : "貼文將維持隱藏。 ");
    } catch (error) {
      setFeedback(error instanceof Error ? `審核失敗：${error.message}` : "審核失敗。");
    }
  }

  async function addBlockedNickname() {
    const clean = blacklistName.trim();
    if (!clean) return;
    setFeedback("正在新增暱稱黑名單…");
    try {
      const entry = await addNicknameBlacklist(clean);
      setNicknameBlacklist(current => [...current, entry].sort((a, b) => a.name.localeCompare(b.name)));
      setBlacklistName("");
      setFeedback(`已封鎖暱稱「${entry.name}」（不分大小寫）。`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
      setFeedback(message.includes("duplicate") || message.includes("unique")
        ? "這個暱稱已在黑名單中。"
        : `新增暱稱黑名單失敗：${message}`);
    }
  }

  async function removeBlockedNickname(entry: NicknameBlacklistEntry) {
    setFeedback(`正在移除「${entry.name}」…`);
    try {
      await removeNicknameBlacklist(entry.id);
      setNicknameBlacklist(current => current.filter(item => item.id !== entry.id));
      setFeedback(`已從黑名單移除「${entry.name}」。`);
    } catch (error) {
      setFeedback(error instanceof Error ? `移除暱稱黑名單失敗：${error.message}` : "移除暱稱黑名單失敗。");
    }
  }

  function update<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setDraft(current => ({ ...current, [key]: value }));
  }

  function updateMemberPhoto(memberId: string, value: string) {
    setDraft(current => ({ ...current, memberPhotos: { ...(current.memberPhotos || {}), [memberId]: value } }));
  }

  function updateUiText(key: string, value: string) {
    setDraft(current => ({ ...current, uiText: { ...(current.uiText || {}), [key]: value } }));
  }

  function updateEvent(index: number, key: keyof EditableEvent, value: string) {
    setDraft(current => {
      const events = [...(current.events || EVENTS)];
      events[index] = { ...events[index], [key]: value } as EditableEvent;
      return { ...current, events };
    });
  }

  function addEvent() {
    setDraft(current => ({
      ...current,
      events: [...(current.events || EVENTS), { title: "New activity", sub: "Official update", startDate: "", endDate: "", dates: "", locations: "Official channels", type: "News", status: "future", desc: "Confirm details with official announcements." }],
    }));
  }

  function removeEvent(index: number) {
    setDraft(current => ({ ...current, events: (current.events || EVENTS).filter((_, eventIndex) => eventIndex !== index) }));
  }

  function updateAlbum(index: number, key: keyof SpotifyRelease, value: string) {
    setDraft(current => {
      const albums = [...(current.albums || [])];
      const existing = albums[index] || { id: `manual-${index}`, title: "", year: "", type: "Album", imageUrl: "", spotifyUrl: "", tracks: [] };
      albums[index] = {
        ...existing,
        [key]: key === "tracks" ? value.split(/\r?\n/).map(item => item.trim()).filter(Boolean) : value,
      } as SpotifyRelease;
      return { ...current, albums };
    });
  }

  function addAlbum() {
    setDraft(current => ({
      ...current,
      albums: [...(current.albums || []), { id: `manual-${Date.now().toString(36)}`, title: "", year: "", type: "Album", imageUrl: "", spotifyUrl: "", tracks: [] }],
    }));
  }

  function removeAlbum(index: number) {
    setDraft(current => ({ ...current, albums: (current.albums || []).filter((_, albumIndex) => albumIndex !== index) }));
  }

  function updateMemberInstagramPosts(memberId: string, value: string) {
    setDraft(current => ({
      ...current,
      instagramPosts: {
        ...normalizeMemberInstagramPosts(current.instagramPosts),
        [memberId]: value.split("\n").map(item => item.trim()).filter(Boolean),
      },
    }));
  }

  async function saveInstagramPostsOnly() {
    const posts = normalizeMemberInstagramPosts(draft.instagramPosts);

    setFeedback("正在儲存 Instagram 貼文…");
    try {
      await saveSiteContent({ instagramPosts: posts });
      setDraft(current => ({ ...current, instagramPosts: posts }));
      onSaved({ ...content, instagramPosts: posts, siteName: OFFICIAL_BRAND_NAME, faviconUrl: FIXED_FAVICON_URL });
      const count = Object.values(posts).reduce((total, memberPosts) => total + memberPosts.length, 0);
      setFeedback(`Instagram 貼文已儲存（${count} 則）。`);
    } catch (error) {
      setFeedback(error instanceof Error
        ? `Instagram 儲存失敗：${error.message}`
        : "Instagram 儲存失敗，請確認目前帳號具有管理員權限。");
    }
  }

  async function importSpotifyAlbums() {
    setFeedback("Fetching Spotify releases...");
    try {
      const result = await fetchSpotifyReleaseStatus();
      if (!result.releases.length) {
        setFeedback(`Spotify 沒有回傳專輯。狀態：${result.error || "NO_SPOTIFY_RELEASES"}`);
        return;
      }
      setDraft(current => {
        const existing = current.albums || [];
        const existingIds = new Set(existing.map(album => album.id || album.spotifyUrl || album.title));
        const additions = result.releases.filter(album => !existingIds.has(album.id || album.spotifyUrl || album.title));
        return { ...current, albums: [...existing, ...additions] };
      });
      setFeedback(`已匯入 Spotify 專輯，可編輯後儲存。${result.error ? `狀態：${result.error}` : ""}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Spotify releases could not be imported.");
    }
  }

  async function syncSpotifyAlbums() {
    setFeedback("正在從 Spotify 同步最新作品與曲目…");
    try {
      const result = await fetchSpotifyReleaseStatus();
      if (!result.releases.length) {
        setFeedback(`Spotify 沒有回傳作品。狀態：${result.error || "NO_SPOTIFY_RELEASES"}`);
        return;
      }

      const existing = draft.albums || [];
      const remoteByKey = new Map(result.releases.map(album => [album.id || album.spotifyUrl || `${album.title}|${album.releaseDate || album.year}`, album]));
      const merged = existing.map(album => {
        const key = album.id || album.spotifyUrl || `${album.title}|${album.releaseDate || album.year}`;
        const remote = remoteByKey.get(key);
        if (!remote) return album;
        remoteByKey.delete(key);
        return { ...album, ...remote, tracks: remote.tracks.length ? remote.tracks : album.tracks };
      });
      const additions = [...remoteByKey.values()];
      const albums = [...additions, ...merged].sort((a, b) => String(b.releaseDate || b.year).localeCompare(String(a.releaseDate || a.year)));
      const nextContent = { ...draft, albums };
      const { siteName: _siteName, faviconUrl: _faviconUrl, ...savedContent } = nextContent;
      await saveSiteContent(savedContent);
      setDraft(nextContent);
      onSaved({ ...savedContent, siteName: OFFICIAL_BRAND_NAME, faviconUrl: FIXED_FAVICON_URL });
      const filledTracks = result.releases.filter(album => album.tracks.length).length;
      setFeedback(`Spotify 同步完成：新增 ${additions.length} 筆作品，${filledTracks} 筆作品已抓取曲目並自動儲存。`);
    } catch (error) {
      setFeedback(error instanceof Error ? `Spotify 同步失敗：${error.message}` : "Spotify 同步失敗。");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("Saving...");
    try {
      const { siteName: _siteName, faviconUrl: _faviconUrl, ...editableDraft } = draft;
      const nextContent = {
        ...editableDraft,
        events: classifyEventsByDate(editableDraft.events || []),
        instagramPosts: normalizeMemberInstagramPosts(editableDraft.instagramPosts),
      };
      await saveSiteContent(nextContent);
      onSaved({ ...nextContent, siteName: OFFICIAL_BRAND_NAME, faviconUrl: FIXED_FAVICON_URL });
      setFeedback("Saved. Public pages will use the new content immediately.");
    } catch (error) {
      setFeedback(error instanceof Error && error.message !== "SUPABASE_NOT_CONFIGURED" ? error.message : "Supabase is not configured or your account is not admin.");
    }
  }

  const inputClass = "mt-2 w-full bg-black border border-white/15 p-3 text-white/75 text-sm focus:outline-none focus:border-red-600/60";
  const labelClass = "block text-white/45 text-xs tracking-wider";
  const events = draft.events || [];
  const classifiedEvents = classifyEventsByDate(events);
  const albums = draft.albums || [];
  const instagramPosts = normalizeMemberInstagramPosts(draft.instagramPosts);
  const uiText = draft.uiText || {};

  return <div className="fixed inset-0 z-[105] bg-black/88 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Admin dashboard">
    <form onSubmit={submit} className="w-full max-w-5xl max-h-[92vh] overflow-auto bg-[#090909] border border-white/15 p-6 md:p-8 shadow-2xl">
      <div className="flex items-start justify-between gap-5 mb-7">
        <div>
          <p className="text-red-400 text-xs tracking-[0.35em] uppercase mb-2">Admin CMS</p>
          <h2 className="text-white font-black text-4xl md:text-5xl leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>SITE CONTENT</h2>
        </div>
        <button type="button" onClick={onClose} className="text-white/50 hover:text-white" aria-label="Close"><X size={22} aria-hidden="true" /></button>
      </div>

      <div className="grid gap-8">
        <AdminAccordion title="檢舉審核通知" description="同一貼文被五位不同使用者檢舉後會先自動隱藏，等待管理員決定。" badge={<span className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-300">{moderationQueue.length} 待審</span>}>
          <div className="grid gap-3">
            {moderationQueue.map(item => <article key={item.id} className="border border-red-500/20 bg-red-500/[0.035] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium text-white/65">{item.authorNickname}</span>
                <span className="text-red-300">{item.reportCount} 次檢舉</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/55">{item.postBody}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => void reviewReportedPost(item, "restored")} className="border border-white/15 px-3 py-2 text-xs text-white/60 hover:text-white">恢復貼文</button>
                <button type="button" onClick={() => void reviewReportedPost(item, "hidden")} className="border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs text-red-300">維持隱藏</button>
              </div>
            </article>)}
            {!moderationQueue.length && <p className="text-white/30 text-xs">目前沒有等待審核的貼文。</p>}
          </div>
        </AdminAccordion>

        <AdminAccordion title="網站資訊">
          <div className="grid md:grid-cols-2 gap-4">
            <div className={labelClass}>網站名稱<div className="mt-2 border border-white/10 bg-white/[0.025] p-3 text-white/40 text-sm">Monstiez（固定）</div></div>
            <label className={labelClass}>網站短標語<input value={draft.siteTagline || ""} onChange={e => update("siteTagline", e.target.value)} className={inputClass} /></label>
            <div className={labelClass}>Favicon / icon<div className="mt-2 border border-white/10 bg-white/[0.025] p-3 text-white/40 text-sm">/favicon.svg（固定）</div></div>
            <label className={labelClass}>社群分享圖片 URL<input value={draft.ogImageUrl || ""} onChange={e => update("ogImageUrl", e.target.value)} placeholder="https://..." className={inputClass} /></label>
          </div>
        </AdminAccordion>

        <AdminAccordion title="首頁與介紹">
          <div className="grid md:grid-cols-2 gap-4">
            <label className={labelClass}>Hero 小標<input value={draft.heroKicker || ""} onChange={e => update("heroKicker", e.target.value)} className={inputClass} /></label>
            <label className={labelClass}>Hero 背景圖片 URL<input value={draft.heroImageUrl || ""} onChange={e => update("heroImageUrl", e.target.value)} placeholder="https://..." className={inputClass} /></label>
            <label className={`${labelClass} md:col-span-2`}>Hero 文字<textarea rows={3} value={draft.heroNote || ""} onChange={e => update("heroNote", e.target.value)} className={inputClass} /></label>
            <label className={labelClass}>介紹圖片 URL<input value={draft.aboutImageUrl || ""} onChange={e => update("aboutImageUrl", e.target.value)} placeholder="https://..." className={inputClass} /></label>
            <div className="md:col-span-2"><AdminLocalizedTextFields baseKey="storyLead" label="介紹短文（六種語言）" uiText={uiText} onChange={updateUiText} rows={4} /></div>
            <div className="md:col-span-2"><AdminLocalizedTextFields baseKey="storyBody" label="完整介紹（六種語言）" uiText={uiText} onChange={updateUiText} rows={5} /></div>
            <div className="md:col-span-2"><AdminLocalizedTextFields baseKey="groupDetail" label="團體詳細介紹／彈窗（六種語言）" uiText={uiText} onChange={updateUiText} rows={6} /></div>
          </div>
        </AdminAccordion>

        <AdminAccordion title="成員圖片 URL" description="建議使用官方允許 embed 的內容、授權素材、自己拍攝或粉絲授權圖片。不要直接抓未授權官方照或 Google 圖片。">
          <div className="grid md:grid-cols-2 gap-4">
            {MEMBERS.map(member => <label key={member.id} className={labelClass}>{member.name}<input value={draft.memberPhotos?.[member.id] || ""} onChange={e => updateMemberPhoto(member.id, e.target.value)} placeholder="https://..." className={inputClass} /></label>)}
          </div>
        </AdminAccordion>

        <AdminAccordion title="團員介紹與詳細介紹">
          <div className="grid gap-4">
            {MEMBERS.map(member => <details key={member.id} className="admin-item-accordion border border-white/8">
              <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-white/70 font-bold">{member.name}<ChevronDown size={16} className="text-white/35 transition-transform duration-200" /></summary>
              <div className="grid gap-4 px-4 pb-4">
                <AdminLocalizedTextFields baseKey={`member.${member.id}.bio`} label="頁面短介紹（六種語言）" uiText={uiText} onChange={updateUiText} rows={4} />
                <AdminLocalizedTextFields baseKey={`member.${member.id}.detail`} label="詳細介紹／彈窗（六種語言）" uiText={uiText} onChange={updateUiText} rows={5} />
              </div>
            </details>)}
          </div>
        </AdminAccordion>

        <AdminAccordion title="暱稱黑名單" description="只封鎖完全相同的暱稱，不分大小寫。例如封鎖 ahyeon 後，Ahyeon 與 AHYEON 都不能使用，但 ahyeon lover 與 aheyno 仍可使用。">
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={blacklistName} onChange={event => setBlacklistName(event.target.value)} maxLength={24} placeholder="輸入要封鎖的完整暱稱" className={`${inputClass} mt-0`} />
            <button type="button" onClick={() => void addBlockedNickname()} className="shrink-0 px-4 py-3 border border-red-500/40 bg-red-600/10 text-red-200 text-xs hover:bg-red-600/20">加入黑名單</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {nicknameBlacklist.length ? nicknameBlacklist.map(entry => <div key={entry.id} className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-white/65 text-xs">
              <span>{entry.name}</span>
              <button type="button" onClick={() => void removeBlockedNickname(entry)} className="text-red-400 hover:text-red-300" aria-label={`從黑名單移除 ${entry.name}`}><X size={13} aria-hidden="true" /></button>
            </div>) : <p className="text-white/30 text-xs">目前沒有黑名單名稱。</p>}
          </div>
        </AdminAccordion>

        <AdminAccordion title="近期活動">
          <div className="flex justify-end mb-4">
            <button type="button" onClick={addEvent} className="px-3 py-2 border border-white/15 text-white/60 text-xs hover:text-white">新增活動</button>
          </div>
          <div className="grid gap-4">
            {events.map((event, index) => <details key={event.id ?? index} className="admin-item-accordion border border-white/8">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4"><span className="text-white/70 font-bold">{event.title || `活動 ${index + 1}`}</span><span className="flex items-center gap-2 text-xs text-white/35">{event.startDate || "未設定日期"}<ChevronDown size={16} className="transition-transform duration-200" /></span></summary>
              <div className="grid md:grid-cols-2 gap-3 px-4 pb-4">
                <label className={labelClass}>標題<input value={event.title} onChange={e => updateEvent(index, "title", e.target.value)} className={inputClass} /></label>
                <label className={labelClass}>副標<input value={event.sub} onChange={e => updateEvent(index, "sub", e.target.value)} className={inputClass} /></label>
                <label className={labelClass}>開始日期<input type="date" value={event.startDate || ""} onChange={e => updateEvent(index, "startDate", e.target.value)} className={inputClass} /></label>
                <label className={labelClass}>結束日期<input type="date" min={event.startDate || undefined} value={event.endDate || event.startDate || ""} onChange={e => updateEvent(index, "endDate", e.target.value)} className={inputClass} /></label>
                <label className={labelClass}>地點<input value={event.locations} onChange={e => updateEvent(index, "locations", e.target.value)} className={inputClass} /></label>
                <div className={labelClass}>自動狀態<div className="mt-2 border border-white/10 bg-white/[0.025] p-3 text-white/55 text-sm">{eventStatusLabel(classifiedEvents[index]?.status || "future", "zh-TW")}</div></div>
                <label className={labelClass}>類型<input value={event.type} onChange={e => updateEvent(index, "type", e.target.value)} className={inputClass} /></label>
                <label className={`${labelClass} md:col-span-2`}>說明<textarea rows={3} value={event.desc} onChange={e => updateEvent(index, "desc", e.target.value)} className={inputClass} /></label>
                <button type="button" onClick={() => removeEvent(index)} className="text-left text-red-400/70 hover:text-red-300 text-xs">刪除這筆活動</button>
              </div>
            </details>)}
          </div>
        </AdminAccordion>

        <AdminAccordion title="成員 Instagram 貼文">
          <div className="flex justify-end mb-4">
            <button type="button" onClick={() => void saveInstagramPostsOnly()} className="px-3 py-2 border border-red-500/40 bg-red-600/10 text-red-200 text-xs hover:bg-red-600/20">儲存 Instagram</button>
          </div>
          <div className="grid gap-3">
            {MEMBERS.map(member => <details key={member.id} className="admin-item-accordion border border-white/8">
              <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-white/70 font-bold">{member.name}<ChevronDown size={16} className="text-white/35 transition-transform duration-200" /></summary>
              <label className={`${labelClass} block px-4 pb-4`}>每行一個貼文網址
                <textarea rows={3} value={(instagramPosts[member.id] || []).join("\n")} onChange={event => updateMemberInstagramPosts(member.id, event.target.value)} placeholder="https://www.instagram.com/p/..." className={inputClass} />
              </label>
            </details>)}
          </div>
        </AdminAccordion>

        <AdminAccordion title="專輯／單曲管理" description="自動同步會從 Spotify 抓取 BABYMONSTER 的作品、封面與完整曲目並立即儲存；手動曲目請每行輸入一首。">
          <div className="flex justify-end mb-4">
            <div className="flex flex-wrap gap-2 justify-end">
              <button type="button" onClick={() => void importSpotifyAlbums()} className="px-3 py-2 border border-red-500/35 text-red-300/80 text-xs hover:text-red-200">匯入 Spotify</button>
              <button type="button" onClick={() => void syncSpotifyAlbums()} className="px-3 py-2 bg-[#E01020] text-white text-xs hover:bg-red-700">自動同步最新作品</button>
              <button type="button" onClick={addAlbum} className="px-3 py-2 border border-white/15 text-white/60 text-xs hover:text-white">新增專輯</button>
            </div>
          </div>
          <div className="grid gap-4">
            {albums.map((album, index) => <details key={album.id || index} className="admin-item-accordion border border-white/8">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4"><span className="text-white/70 font-bold">{album.title || `作品 ${index + 1}`}</span><span className="flex items-center gap-2 text-xs text-white/35">{album.year || ""}<ChevronDown size={16} className="transition-transform duration-200" /></span></summary>
              <div className="grid md:grid-cols-2 gap-3 px-4 pb-4">
                <label className={labelClass}>標題<input value={album.title || ""} onChange={e => updateAlbum(index, "title", e.target.value)} className={inputClass} /></label>
                <label className={labelClass}>年份<input value={album.year || ""} onChange={e => updateAlbum(index, "year", e.target.value)} className={inputClass} /></label>
                <label className={labelClass}>類型<input value={album.type || ""} onChange={e => updateAlbum(index, "type", e.target.value)} placeholder="Album / Single / EP" className={inputClass} /></label>
                <label className={labelClass}>Spotify 連結<input value={album.spotifyUrl || ""} onChange={e => updateAlbum(index, "spotifyUrl", e.target.value)} placeholder="https://open.spotify.com/..." className={inputClass} /></label>
                <label className={`${labelClass} md:col-span-2`}>封面圖片 URL<input value={album.imageUrl || ""} onChange={e => updateAlbum(index, "imageUrl", e.target.value)} placeholder="https://i.scdn.co/..." className={inputClass} /></label>
                <label className={`${labelClass} md:col-span-2`}>曲目（每行一首）<textarea rows={Math.min(10, Math.max(3, album.tracks?.length || 3))} value={(album.tracks || []).join("\n")} onChange={e => updateAlbum(index, "tracks", e.target.value)} placeholder={"DRIP\nCLIK CLAK\nLove In My Heart"} className={inputClass} /></label>
                <button type="button" onClick={() => removeAlbum(index)} className="text-left text-red-400/70 hover:text-red-300 text-xs">刪除這張專輯</button>
              </div>
            </details>)}
          </div>
        </AdminAccordion>

      </div>

      <div className="sticky bottom-0 mt-8 -mx-6 md:-mx-8 -mb-6 md:-mb-8 border-t border-white/10 bg-[#090909]/95 backdrop-blur px-6 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-white/35 text-xs">{feedback || "只有 Supabase role=admin 的帳號能儲存。"}</p>
        <button type="submit" className="inline-flex items-center gap-2 px-5 py-3 bg-[#E01020] text-white text-xs tracking-[0.2em] uppercase"><Save size={14} />儲存變更</button>
      </div>
    </form>
  </div>;
}

function EditToolbar({ dirty, locale, onSave, onAddSection, onOpenAdmin, onStop }: {
  dirty: boolean; locale: Locale; onSave: () => void; onAddSection: (kind: "text" | "image" | "mixed") => void; onOpenAdmin: () => void; onStop: () => void;
}) {
  const f = fixedMessages[locale];
  return <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-[120] flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/12 bg-black/90 px-4 py-3 shadow-2xl backdrop-blur">
    <span className="text-red-300 text-xs tracking-[0.25em] uppercase">{f.editMode}</span>
    <button onClick={onSave} className="px-3 py-2 rounded-full bg-[#E01020] text-white text-xs disabled:opacity-40" disabled={!dirty}>{f.save}{dirty ? " *" : ""}</button>
    <button onClick={() => onAddSection("text")} className="px-3 py-2 rounded-full border border-white/15 text-white/60 text-xs">{f.addText}</button>
    <button onClick={() => onAddSection("image")} className="px-3 py-2 rounded-full border border-white/15 text-white/60 text-xs">{f.addImage}</button>
    <button onClick={() => onAddSection("mixed")} className="px-3 py-2 rounded-full border border-white/15 text-white/60 text-xs">{f.addSection}</button>
    <button onClick={onOpenAdmin} className="px-3 py-2 rounded-full border border-white/15 text-white/60 text-xs">{f.activityManager}</button>
    <button onClick={onStop} className="px-3 py-2 rounded-full border border-white/15 text-white/60 text-xs">{messages[locale].close}</button>
  </div>;
}

function CustomSections({ sections }: { sections: NonNullable<SiteContent["customSections"]> }) {
  if (!sections.length) return null;
  return <section className="bg-black py-24 md:py-36 border-t border-white/5">
    <div className="max-w-7xl mx-auto px-6 grid gap-20">
      {sections.map(section => <article key={section.id} className="grid md:grid-cols-2 gap-10 items-center">
        {(section.kind === "image" || section.kind === "mixed") && <div className="aspect-[16/10] overflow-hidden bg-neutral-950 border border-white/8">
          <EditableImage k={`customSections.${section.id}.imageUrl`} alt={section.title || "Custom section image"} className="w-full h-full object-cover" />
        </div>}
        {(section.kind === "text" || section.kind === "mixed") && <div>
          <EditableText k={`customSections.${section.id}.title`} fallback={section.title || ""} as="h2" className="text-white font-black text-5xl md:text-7xl leading-none mb-5" />
          <EditableText k={`customSections.${section.id}.body`} fallback={section.body || ""} as="p" className="text-white/55 text-sm md:text-base leading-relaxed whitespace-pre-wrap" />
        </div>}
      </article>)}
    </div>
  </section>;
}

function TextEditModal({ editKey, values, fallback, locale, onSave, onClose }: {
  editKey: string;
  values: Record<Locale, string>;
  fallback: string;
  locale: Locale;
  onSave: (values: Record<Locale, string>) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Record<Locale, string>>(() => ({ ...values }));
  const f = fixedMessages[locale];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft);
  }
  return <div className="fixed inset-0 z-[130] bg-black/90 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={f.textEditorTitle}>
    <form onSubmit={submit} className="w-full max-w-5xl max-h-[92vh] overflow-auto bg-[#090909] border border-white/15 p-6 md:p-8 shadow-2xl">
      <div className="flex items-start justify-between gap-5 mb-6">
        <div>
          <p className="text-red-400 text-xs tracking-[0.35em] uppercase mb-2">{f.textEditorKicker}</p>
          <h2 className="text-white font-black text-4xl md:text-5xl leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{f.textEditorTitle}</h2>
          <p className="text-white/30 text-xs mt-3 break-all">{editKey}</p>
        </div>
        <button type="button" onClick={onClose} className="text-white/50 hover:text-white" aria-label={f.closeDialog}><X size={22} aria-hidden="true" /></button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {supportedLocales.map(item => (
          <label key={item} className="block text-white/45 text-xs tracking-wider">
            {localeLabels[item]}
            <textarea rows={5} value={draft[item] || ""} placeholder={fallback}
              onChange={event => setDraft(current => ({ ...current, [item]: event.target.value }))}
              className="mt-2 w-full resize-y bg-black border border-white/15 p-3 text-white/75 text-sm leading-relaxed focus:outline-none focus:border-red-600/60" />
          </label>
        ))}
      </div>
      <div className="mt-7 flex flex-wrap items-center justify-end gap-3">
        <button type="button" onClick={onClose} className="px-5 py-3 border border-white/15 text-white/55 text-xs tracking-[0.2em] uppercase">{f.cancel}</button>
        <button type="submit" className="px-5 py-3 bg-[#E01020] text-white text-xs tracking-[0.2em] uppercase">{f.saveSixLanguages}</button>
      </div>
    </form>
  </div>;
}

function nicknameErrorMessage(error: unknown, locale: Locale, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  const copy = {
    "zh-TW": { taken: "這個暱稱已被使用，請選擇其他暱稱。", blocked: "這個暱稱無法使用，請選擇其他暱稱。", invalid: "暱稱必須為 2 至 24 個字元。" },
    "zh-CN": { taken: "这个昵称已被使用，请选择其他昵称。", blocked: "这个昵称无法使用，请选择其他昵称。", invalid: "昵称必须为 2 至 24 个字符。" },
    th: { taken: "ชื่อเล่นนี้ถูกใช้แล้ว โปรดเลือกชื่ออื่น", blocked: "ไม่สามารถใช้ชื่อเล่นนี้ได้ โปรดเลือกชื่ออื่น", invalid: "ชื่อเล่นต้องมีความยาว 2 ถึง 24 ตัวอักษร" },
    en: { taken: "This nickname is already in use. Choose another one.", blocked: "This nickname is not available. Choose another one.", invalid: "Your nickname must be 2 to 24 characters." },
    ko: { taken: "이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해 주세요.", blocked: "사용할 수 없는 닉네임입니다. 다른 닉네임을 선택해 주세요.", invalid: "닉네임은 2자 이상 24자 이하여야 합니다." },
    ja: { taken: "このニックネームは既に使用されています。別の名前を選んでください。", blocked: "このニックネームは使用できません。別の名前を選んでください。", invalid: "ニックネームは2文字以上24文字以内で入力してください。" },
  }[locale];
  if (/NICKNAME_TAKEN|duplicate key|profiles_nickname_normalized_unique/i.test(message)) return copy.taken;
  if (/NICKNAME_BLOCKED/i.test(message)) return copy.blocked;
  if (/NICKNAME_INVALID|at least 2 characters/i.test(message)) return copy.invalid;
  return message && message !== "SUPABASE_NOT_CONFIGURED" ? message : fallback;
}

function NicknameModal({ locale, onSaved }: { locale: Locale; onSaved: (user: User) => void }) {
  const [feedback, setFeedback] = useState("");
  const t = messages[locale];
  const f = fixedMessages[locale];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nickname = String(new FormData(event.currentTarget).get("nickname") || "");
    try {
      const user = await updateFanNickname(nickname);
      onSaved(user);
    } catch (error) { setFeedback(nicknameErrorMessage(error, locale, t.genericError)); }
  }
  return <div className="fixed inset-0 z-[115] bg-black/90 grid place-items-center p-5" role="dialog" aria-modal="true" aria-label={t.nickname}>
    <form onSubmit={submit} className="w-full max-w-md bg-[#090909] border border-white/15 p-7 shadow-2xl">
      <h2 className="text-white font-black text-4xl mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{f.nicknameTitle}</h2>
      <p className="text-white/45 text-sm leading-relaxed mb-6">{f.nicknameHelp}</p>
      <label className="text-white/45 text-xs">{t.nickname}<input name="nickname" required minLength={2} maxLength={24} className="block w-full mt-2 p-3 bg-black border border-white/15 text-white focus:outline-none focus:border-red-600/60" /></label>
      <button type="submit" className="mt-5 w-full p-4 bg-[#E01020] text-white text-xs tracking-[.2em] uppercase">{f.saveNickname}</button>
      {feedback && <p className="text-red-400 text-xs mt-4">{feedback}</p>}
    </form>
  </div>;
}

function OtpCodeInput({ value, onChange, label, disabled = false }: {
  value: string; onChange: (value: string) => void; label: string; disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const focusInput = () => {
    inputRef.current?.focus();
    window.setTimeout(() => inputRef.current?.setSelectionRange(value.length, value.length), 0);
  };
  return <div className="relative" onClick={focusInput}>
    <div className="grid grid-cols-6 gap-2" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => <div
        key={index}
        className={`grid aspect-square place-items-center border bg-black text-2xl font-black tabular-nums transition-colors ${focused && index === Math.min(value.length, 5) ? "border-[#f079a2]" : value[index] ? "border-white/35 text-white" : "border-white/15 text-white/20"}`}
      >{value[index] || ""}</div>)}
    </div>
    <input
      ref={inputRef}
      type="tel"
      id="monstiez-otp-code"
      name="otp"
      value={value}
      maxLength={6}
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="one-time-code"
      autoCapitalize="none"
      spellCheck={false}
      enterKeyHint="done"
      aria-label={label}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={event => onChange(event.currentTarget.value.replace(/\D/g, "").slice(0, 6))}
      onKeyDown={event => {
        if (event.key === "Backspace" && value) {
          event.preventDefault();
          onChange(value.slice(0, -1));
        }
      }}
      className="absolute inset-0 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
    />
  </div>;
}

function AuthModal({ locale, mode, onMode, onClose, onAuthenticated, onPasswordRecoveryVerified }: {
  locale: Locale; mode: "login" | "register"; onMode: (mode: "login" | "register") => void;
  onClose: () => void; onAuthenticated: (user: User) => void; onPasswordRecoveryVerified: () => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [otpRequest, setOtpRequest] = useState<{ type: "signup" | "recovery"; email: string } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [pending, setPending] = useState(false);
  const t = messages[locale];
  const f = fixedMessages[locale];
  const authCopy = {
    "zh-TW": { verify: "6 位數驗證碼已寄出。若未收到，請查看垃圾郵件匣。", forgot: "忘記密碼？", resetTitle: "重設密碼", resetSent: "6 位數重設驗證碼已寄出，請查看收件匣與垃圾郵件匣。", send: "寄送驗證碼", back: "返回登入" },
    "zh-CN": { verify: "6 位数验证码已发送。若未收到，请查看垃圾邮件文件夹。", forgot: "忘记密码？", resetTitle: "重设密码", resetSent: "6 位数重设验证码已发送，请查看收件箱和垃圾邮件文件夹。", send: "发送验证码", back: "返回登录" },
    th: { verify: "ส่งรหัสยืนยัน 6 หลักแล้ว หากไม่พบ โปรดตรวจสอบโฟลเดอร์สแปมหรือจดหมายขยะ", forgot: "ลืมรหัสผ่าน?", resetTitle: "รีเซ็ตรหัสผ่าน", resetSent: "ส่งรหัสรีเซ็ต 6 หลักแล้ว โปรดตรวจสอบกล่องจดหมายและโฟลเดอร์สแปม", send: "ส่งรหัสยืนยัน", back: "กลับไปเข้าสู่ระบบ" },
    en: { verify: "A six-digit verification code was sent. If it is missing, check your spam or junk folder.", forgot: "Forgot password?", resetTitle: "Reset password", resetSent: "A six-digit reset code was sent. Check your inbox and spam or junk folder.", send: "Send verification code", back: "Back to sign in" },
    ko: { verify: "6자리 인증 코드를 보냈습니다. 보이지 않으면 스팸 메일함도 확인해 주세요.", forgot: "비밀번호를 잊으셨나요?", resetTitle: "비밀번호 재설정", resetSent: "6자리 재설정 코드를 보냈습니다. 받은편지함과 스팸 메일함을 확인해 주세요.", send: "인증 코드 보내기", back: "로그인으로 돌아가기" },
    ja: { verify: "6桁の確認コードを送信しました。届かない場合は迷惑メールフォルダもご確認ください。", forgot: "パスワードを忘れた場合", resetTitle: "パスワードを再設定", resetSent: "6桁の再設定コードを送信しました。受信トレイと迷惑メールフォルダをご確認ください。", send: "確認コードを送信", back: "ログインに戻る" },
  }[locale];
  const otpCopy = {
    "zh-TW": { signupTitle: "輸入驗證碼", recoveryTitle: "驗證你的身分", sentTo: "我們已將 6 位數驗證碼寄到", label: "6 位數驗證碼", verify: "驗證", resend: "重新寄送驗證碼", resent: "新的驗證碼已寄出，請查看收件匣與垃圾郵件匣。", invalid: "請輸入完整的 6 位數驗證碼。", change: "更改電子信箱" },
    "zh-CN": { signupTitle: "输入验证码", recoveryTitle: "验证你的身份", sentTo: "我们已将 6 位数验证码发送至", label: "6 位数验证码", verify: "验证", resend: "重新发送验证码", resent: "新的验证码已发送，请查看收件箱和垃圾邮件文件夹。", invalid: "请输入完整的 6 位数验证码。", change: "更改电子邮箱" },
    th: { signupTitle: "กรอกรหัสยืนยัน", recoveryTitle: "ยืนยันตัวตนของคุณ", sentTo: "เราได้ส่งรหัส 6 หลักไปที่", label: "รหัสยืนยัน 6 หลัก", verify: "ยืนยัน", resend: "ส่งรหัสอีกครั้ง", resent: "ส่งรหัสใหม่แล้ว โปรดตรวจสอบกล่องจดหมายและโฟลเดอร์สแปม", invalid: "โปรดกรอกรหัสยืนยัน 6 หลักให้ครบ", change: "เปลี่ยนอีเมล" },
    en: { signupTitle: "Enter verification code", recoveryTitle: "Verify your identity", sentTo: "We sent a six-digit code to", label: "Six-digit verification code", verify: "Verify code", resend: "Resend code", resent: "A new code was sent. Check your inbox and spam or junk folder.", invalid: "Enter the complete six-digit code.", change: "Change email" },
    ko: { signupTitle: "인증 코드 입력", recoveryTitle: "본인 확인", sentTo: "6자리 인증 코드를 다음 주소로 보냈습니다", label: "6자리 인증 코드", verify: "코드 확인", resend: "코드 다시 보내기", resent: "새 코드를 보냈습니다. 받은편지함과 스팸 메일함을 확인해 주세요.", invalid: "6자리 인증 코드를 모두 입력해 주세요.", change: "이메일 변경" },
    ja: { signupTitle: "確認コードを入力", recoveryTitle: "本人確認", sentTo: "6桁の確認コードを次のアドレスへ送信しました", label: "6桁の確認コード", verify: "コードを確認", resend: "コードを再送信", resent: "新しいコードを送信しました。受信トレイと迷惑メールフォルダをご確認ください。", invalid: "6桁の確認コードをすべて入力してください。", change: "メールアドレスを変更" },
  }[locale];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFeedback("");
    if (pending) return;
    setPending(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const result = await emailAuth(mode, String(payload.email || ""), String(payload.password || ""), String(payload.nickname || ""));
      if (result.user) { onAuthenticated(result.user); onClose(); }
      else if (result.needsEmailConfirmation) {
        setOtpCode("");
        setOtpRequest({ type: "signup", email: String(payload.email || "") });
        setFeedback(authCopy.verify);
      }
    } catch (error) { setFeedback(mode === "register" ? nicknameErrorMessage(error, locale, t.genericError) : error instanceof Error && error.message !== "SUPABASE_NOT_CONFIGURED" ? error.message : t.genericError); }
    finally { setPending(false); }
  }
  async function sendReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFeedback("");
    if (pending) return;
    setPending(true);
    const email = String(new FormData(event.currentTarget).get("email") || "");
    try {
      await requestPasswordReset(email);
      setOtpCode("");
      setOtpRequest({ type: "recovery", email });
      setFeedback(authCopy.resetSent);
    }
    catch (error) { setFeedback(error instanceof Error ? error.message : t.genericError); }
    finally { setPending(false); }
  }
  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFeedback("");
    if (!otpRequest || otpCode.length !== 6) { setFeedback(otpCopy.invalid); return; }
    if (pending) return;
    setPending(true);
    try {
      if (otpRequest.type === "signup") {
        const verifiedUser = await verifyEmailOtp(otpRequest.email, otpCode);
        if (!verifiedUser) throw new Error(t.genericError);
        onAuthenticated(verifiedUser);
        onClose();
      } else {
        await verifyPasswordRecoveryOtp(otpRequest.email, otpCode);
        onClose();
        onPasswordRecoveryVerified();
      }
    } catch (error) { setFeedback(error instanceof Error ? error.message : t.genericError); }
    finally { setPending(false); }
  }
  async function resendOtp() {
    if (!otpRequest || pending) return;
    setPending(true); setFeedback("");
    try {
      if (otpRequest.type === "signup") await resendSignupOtp(otpRequest.email);
      else await requestPasswordReset(otpRequest.email);
      setOtpCode("");
      setFeedback(otpCopy.resent);
    } catch (error) { setFeedback(error instanceof Error ? error.message : t.genericError); }
    finally { setPending(false); }
  }
  async function oauth(provider: "google") {
    setFeedback("");
    if (pending) return;
    setPending(true);
    try { await socialAuth(provider); } catch (error) { setFeedback(error instanceof Error ? error.message : t.genericError); setPending(false); }
  }
  return <div className="fixed inset-0 z-[100] bg-black/85 grid place-items-center p-5" role="dialog" aria-modal="true" aria-label={t.login}>
    <div className="w-full max-w-lg max-h-[92vh] overflow-auto bg-[#090909] border border-white/15 p-7 shadow-2xl">
      <div className="flex items-center justify-between"><h2 className="text-white font-black text-4xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>JOIN <span className="text-[#E01020]">MONSTIEZ</span></h2><button onClick={onClose} className="text-white/50 hover:text-white" aria-label={t.close}><X size={22} aria-hidden="true" /></button></div>
      <p className="text-white/42 text-xs leading-relaxed mt-4">
        {f.authPurpose}
      </p>
      {!forgotPassword && !otpRequest && <div className="grid grid-cols-2 border-b border-white/10 my-6"><button onClick={() => onMode("login")} className={`py-3 text-sm ${mode === "login" ? "text-white border-b-2 border-red-600" : "text-white/35"}`}>{t.loginTab}</button><button onClick={() => onMode("register")} className={`py-3 text-sm ${mode === "register" ? "text-white border-b-2 border-red-600" : "text-white/35"}`}>{t.registerTab}</button></div>}
      {otpRequest ? <form onSubmit={verifyOtp} className="mt-7 grid gap-5">
        <div><h3 className="text-3xl font-black text-white">{otpRequest.type === "signup" ? otpCopy.signupTitle : otpCopy.recoveryTitle}</h3><p className="mt-3 text-sm leading-relaxed text-white/50">{otpCopy.sentTo}<br /><strong className="text-white/80">{otpRequest.email}</strong></p></div>
        <OtpCodeInput value={otpCode} onChange={setOtpCode} label={otpCopy.label} disabled={pending} />
        <button type="submit" disabled={pending || otpCode.length !== 6} className="p-4 bg-[#E01020] text-white text-xs tracking-[.2em] uppercase disabled:opacity-40">{pending ? "…" : otpCopy.verify}</button>
        <div className="flex items-center justify-between gap-4 text-xs"><button type="button" disabled={pending} onClick={() => void resendOtp()} className="text-[#f079a2] disabled:opacity-40">{otpCopy.resend}</button><button type="button" onClick={() => { setOtpRequest(null); setOtpCode(""); setFeedback(""); }} className="text-white/45 hover:text-white">{otpCopy.change}</button></div>
      </form> : forgotPassword ? <form onSubmit={sendReset} className="mt-6 grid gap-4">
        <h3 className="text-2xl font-black text-white">{authCopy.resetTitle}</h3>
        <label className="text-white/45 text-xs">{t.email}<input name="email" type="email" required className="block w-full mt-2 p-3 bg-black border border-white/15 text-white focus:outline-none focus:border-red-600/60" /></label>
        <button type="submit" disabled={pending} className="p-4 bg-[#E01020] text-white text-xs tracking-[.2em] uppercase disabled:opacity-50">{pending ? "…" : authCopy.send}</button>
        <button type="button" onClick={() => { setForgotPassword(false); setFeedback(""); }} className="text-xs text-white/45 hover:text-white">{authCopy.back}</button>
      </form> : <>
      <button onClick={() => void oauth("google")} disabled={pending} className="w-full min-h-11 border border-white/15 p-3 text-center text-white/60 text-xs disabled:opacity-50">{pending ? f.connecting : "Google"}</button>
      <div className="text-center text-white/25 text-xs my-5">— {t.orEmail} —</div>
      <form onSubmit={submit} className="grid gap-4">
        {mode === "register" && <label className="text-white/45 text-xs">{t.nickname}<input name="nickname" required minLength={2} maxLength={24} className="block w-full mt-2 p-3 bg-black border border-white/15 text-white focus:outline-none focus:border-red-600/60" /></label>}
        <label className="text-white/45 text-xs">{t.email}<input name="email" type="email" required className="block w-full mt-2 p-3 bg-black border border-white/15 text-white focus:outline-none focus:border-red-600/60" /></label>
        <label className="text-white/45 text-xs">{t.password}<input name="password" type="password" required minLength={10} className="block w-full mt-2 p-3 bg-black border border-white/15 text-white focus:outline-none focus:border-red-600/60" /></label>
        <button type="submit" disabled={pending} className="p-4 bg-[#E01020] text-white text-xs tracking-[.2em] uppercase disabled:opacity-50">{pending ? "…" : mode === "register" ? t.createAccount : t.loginBoard}</button>
      </form>
      {mode === "login" && <button type="button" onClick={() => { setForgotPassword(true); setFeedback(""); }} className="mt-4 text-xs text-red-300/75 hover:text-red-200">{authCopy.forgot}</button>}
      </>}
      {feedback && <p className="text-red-400 text-xs mt-4">{feedback}</p>}
    </div>
  </div>;
}

function ResetPasswordModal({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const [feedback, setFeedback] = useState("");
  const t = messages[locale];
  const copy = {
    "zh-TW": { title: "設定新密碼", save: "更新密碼", success: "密碼已更新，可以使用新密碼登入。", mismatch: "兩次密碼不一致。", confirm: "再次輸入密碼" },
    "zh-CN": { title: "设置新密码", save: "更新密码", success: "密码已更新。", mismatch: "两次密码不一致。", confirm: "再次输入密码" },
    th: { title: "ตั้งรหัสผ่านใหม่", save: "อัปเดตรหัสผ่าน", success: "อัปเดตรหัสผ่านแล้ว", mismatch: "รหัสผ่านไม่ตรงกัน", confirm: "ยืนยันรหัสผ่าน" },
    en: { title: "Set new password", save: "Update password", success: "Password updated. You can now sign in.", mismatch: "Passwords do not match.", confirm: "Confirm password" },
    ko: { title: "새 비밀번호 설정", save: "비밀번호 변경", success: "비밀번호가 변경되었습니다.", mismatch: "비밀번호가 일치하지 않습니다.", confirm: "비밀번호 확인" },
    ja: { title: "新しいパスワード", save: "パスワードを更新", success: "パスワードを更新しました。", mismatch: "パスワードが一致しません。", confirm: "パスワードを再入力" },
  }[locale];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFeedback("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (payload.password !== payload.confirmPassword) { setFeedback(copy.mismatch); return; }
    try {
      await updateFanPassword(String(payload.password || ""));
      window.history.replaceState({}, "", window.location.pathname);
      setFeedback(copy.success);
      window.setTimeout(onClose, 1400);
    } catch (error) { setFeedback(error instanceof Error ? error.message : t.genericError); }
  }
  return <div className="fixed inset-0 z-[125] grid place-items-center bg-black/90 p-5" role="dialog" aria-modal="true" aria-label={copy.title}>
    <form onSubmit={submit} className="w-full max-w-md border border-white/15 bg-[#090909] p-7 shadow-2xl">
      <div className="mb-6 flex justify-between gap-4"><h2 className="text-4xl font-black text-white">{copy.title}</h2><button type="button" onClick={onClose} className="text-white/50" aria-label={t.close}><X size={22} aria-hidden="true" /></button></div>
      <div className="grid gap-4">
        <label className="text-xs text-white/45">{t.password}<input name="password" type="password" required minLength={10} className="mt-2 block w-full border border-white/15 bg-black p-3 text-white" /></label>
        <label className="text-xs text-white/45">{copy.confirm}<input name="confirmPassword" type="password" required minLength={10} className="mt-2 block w-full border border-white/15 bg-black p-3 text-white" /></label>
        <button type="submit" className="bg-[#E01020] p-4 text-xs uppercase tracking-[.2em] text-white">{copy.save}</button>
      </div>
      {feedback && <p className="mt-4 text-xs text-red-400">{feedback}</p>}
    </form>
  </div>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [locale, setLocale] = useState<Locale>("zh-TW");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [passwordRecoveryOpen, setPasswordRecoveryOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [siteContent, setSiteContent] = useState<SiteContent>(cachedSiteContent);
  const [booting, setBooting] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editFeedback, setEditFeedback] = useState("");
  const [textEditRequest, setTextEditRequest] = useState<{ key: string; fallback: string } | null>(null);

  useEffect(() => {
    const next = getInitialLocale(navigator.languages, localStorage.getItem("monstiez-locale"));
    queueMicrotask(() => setLocale(next)); document.documentElement.lang = next;
    let active = true;
    const loaderTimer = window.setTimeout(() => { if (active) setBooting(false); }, 420);
    void currentFanUser().then(nextUser => { if (active) setUser(nextUser); }).catch(() => {});
    void loadSiteContent().then(nextContent => {
      if (!active || !Object.keys(nextContent).length) return;
      cacheSiteContent(nextContent);
      setSiteContent(nextContent);
    }).catch(() => {});
    const unsubscribe = observeFanUser(value => { if (active) setUser(value); });
    return () => { active = false; window.clearTimeout(loaderTimer); unsubscribe(); };
  }, []);

  useEffect(() => {
    const tagline = contentText(siteContent.siteTagline, DEFAULT_SITE_CONTENT.siteTagline);
    const nextTitle = SITE_BROWSER_TITLE;
    document.title = nextTitle;
    localStorage.removeItem("babymonster-site-title");
    localStorage.setItem("monstiez-site-title", nextTitle);
    let icon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.href = FIXED_FAVICON_URL;
    const description = document.querySelector<HTMLMetaElement>("meta[name='description']");
    if (description) description.content = tagline;
    const ogImage = document.querySelector<HTMLMetaElement>("meta[property='og:image']");
    if (ogImage && siteContent.ogImageUrl) ogImage.content = siteContent.ogImageUrl;
  }, [siteContent]);

  useEffect(() => {
    if (Object.keys(siteContent).length) cacheSiteContent(siteContent);
  }, [siteContent]);

  function changeLocale(next: Locale) { setLocale(next); localStorage.setItem("monstiez-locale", next); document.documentElement.lang = next; }
  async function logout() { setUser(null); await signOutFan(); }
  function updateSiteContent(next: SiteContent) { setSiteContent(next); setDirty(true); }
  function openTextEditor(key: string, fallback = "") {
    setTextEditRequest({ key, fallback });
  }
  function localizedTextValues(key: string, fallback = "") {
    return supportedLocales.reduce((values, item) => ({
      ...values,
      [item]: contentText(siteContent.uiText?.[localizedTextKey(key, item)], contentText(siteContent.uiText?.[key], fallback)),
    }), {} as Record<Locale, string>);
  }
  function updateLocalizedText(key: string, values: Record<Locale, string>) {
    const nextUiText = { ...(siteContent.uiText || {}) };
    for (const item of supportedLocales) nextUiText[localizedTextKey(key, item)] = values[item] || "";
    delete nextUiText[key];
    updateSiteContent({ ...siteContent, uiText: nextUiText });
    setTextEditRequest(null);
  }
  function updateImage(key: string, value: string) {
    if (key.startsWith("memberPhotos.")) {
      const memberId = key.split(".")[1];
      updateSiteContent({ ...siteContent, memberPhotos: { ...(siteContent.memberPhotos || {}), [memberId]: value } });
      return;
    }
    if (key.startsWith("customSections.")) {
      const [, id, field] = key.split(".");
      updateSiteContent({ ...siteContent, customSections: (siteContent.customSections || []).map(section => section.id === id ? { ...section, [field]: value } : section) });
      return;
    }
    updateSiteContent({ ...siteContent, [key]: value });
  }
  function readText(key: string, fallback = "") {
    return contentText(siteContent.uiText?.[localizedTextKey(key, locale)], contentText(siteContent.uiText?.[key], fallback));
  }
  function readImage(key: string) {
    if (key.startsWith("memberPhotos.")) return contentUrl(siteContent.memberPhotos?.[key.split(".")[1]], "");
    if (key.startsWith("customSections.")) {
      const [, id, field] = key.split(".");
      const section = (siteContent.customSections || []).find(item => item.id === id) as Record<string, unknown> | undefined;
      return contentUrl(section?.[field], "");
    }
    return contentUrl(siteContent[key as keyof SiteContent], "");
  }
  function addSection(kind: "text" | "image" | "mixed") {
    const id = `section-${Date.now().toString(36)}`;
    updateSiteContent({ ...siteContent, customSections: [...(siteContent.customSections || []), { id, kind, title: "", body: "", imageUrl: "" }] });
  }
  async function saveEdits() {
    setEditFeedback("Saving...");
    try {
      await saveSiteContent(siteContent);
      setDirty(false);
      setEditFeedback("Saved.");
      window.setTimeout(() => setEditFeedback(""), 1800);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Site content could not be saved.";
      setEditFeedback(message);
      window.alert(`${fixedMessages[locale].saveFailed}: ${message}`);
    }
  }

  useEffect(() => {
    // Hide scrollbar
    const style = document.createElement("style");
    style.textContent = `::-webkit-scrollbar{display:none}body{scrollbar-width:none;-ms-overflow-style:none}`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <InlineEditContext.Provider value={{ editing: editMode, locale, text: readText, image: readImage, openTextEditor, updateImage }}>
    <div className="bg-black min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <AnimatePresence>{booting && <OpeningLoader locale={locale} />}</AnimatePresence>
      <Nav user={user} locale={locale} onLocale={changeLocale} onLogin={() => setAuthOpen(true)} onLogout={logout} onAdmin={() => setAdminOpen(true)} onEdit={() => setEditMode(true)} />
      <Hero locale={locale} content={siteContent} />
      <AboutSection locale={locale} content={siteContent} />
      <MembersSection locale={locale} content={siteContent} />
      <MusicSection locale={locale} content={siteContent} />
      <EventsSection locale={locale} content={siteContent} />
      <CustomSections sections={siteContent.customSections || []} />
      <CommunitySection user={user} locale={locale} onLogin={() => setAuthOpen(true)} />
      <FanVoices locale={locale} user={user} />
      <Announcements locale={locale} />
      <AppPurposeSection locale={locale} />
      <Footer locale={locale} content={siteContent} />
      {authOpen && <AuthModal locale={locale} mode={authMode} onMode={setAuthMode} onClose={() => setAuthOpen(false)} onAuthenticated={setUser} onPasswordRecoveryVerified={() => setPasswordRecoveryOpen(true)} />}
      {passwordRecoveryOpen && <ResetPasswordModal locale={locale} onClose={() => setPasswordRecoveryOpen(false)} />}
      {adminOpen && user?.role === "admin" && <AdminPanel content={siteContent} onSaved={setSiteContent} onClose={() => setAdminOpen(false)} />}
      {editMode && user?.role === "admin" && <EditToolbar dirty={dirty} locale={locale} onSave={() => void saveEdits()} onAddSection={addSection} onOpenAdmin={() => setAdminOpen(true)} onStop={() => setEditMode(false)} />}
      {editMode && editFeedback && <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(8.25rem+env(safe-area-inset-bottom))] z-[121] rounded-full border border-white/12 bg-black/90 px-4 py-2 text-white/55 text-xs shadow-2xl">{editFeedback}</div>}
      {textEditRequest && <TextEditModal editKey={textEditRequest.key} fallback={textEditRequest.fallback} locale={locale} values={localizedTextValues(textEditRequest.key, textEditRequest.fallback)} onSave={values => updateLocalizedText(textEditRequest.key, values)} onClose={() => setTextEditRequest(null)} />}
      {user?.needsNickname && <NicknameModal locale={locale} onSaved={setUser} />}
    </div>
    </InlineEditContext.Provider>
  );
}
