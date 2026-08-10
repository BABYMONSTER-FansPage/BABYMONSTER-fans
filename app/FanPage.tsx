"use client";

import { FormEvent, useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import {
  Play, Pause, Volume2, VolumeX, Heart, MessageCircle,
  ChevronDown, Menu, X, Calendar, MapPin, Music, Send, Disc3, Settings, Save,
} from "lucide-react";
import { getInitialLocale, localeLabels, memberBios, messages, supportedLocales, type Locale } from "./i18n";
import {
  createFanPost, currentFanUser, deleteFanPost, editFanPost, emailAuth, listFanPosts,
  listAnnouncements, loadSiteContent, moderateFanPost, observeFanUser, reportFanPost,
  saveSiteContent, signOutFan, socialAuth, toggleFanLike, translateFanPost,
  type EditableEvent, type FanPost as ApiPost, type FanUser as User, type SiteContent,
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

const WAVEFORM = Array.from({ length: 24 }, (_, i) => 5 + ((i * 7 + 3) % 17));

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const MEMBERS = [
  {
    id: "ruka", num: "01", name: "RUKA", hangul: "루카",
    birth: "2002 · Mar 20", nationality: "Japan", flag: "🇯🇵",
    position: "Main Vocalist",
    description: "The eldest of BABYMONSTER, Ruka commands the stage with powerhouse vocals and an effortless grace honed through years of rigorous training. Her emotional depth and unwavering presence define the group's vocal identity.",
    traits: ["Main Vocalist", "Eldest Member", "Stage Commander"],
    photo: "photo-1531746020798-e6953c6e8e04",
    accent: "#E01020",
  },
  {
    id: "pharita", num: "02", name: "PHARITA", hangul: "파리타",
    birth: "2005 · Aug 26", nationality: "Thailand", flag: "🇹🇭",
    position: "Vocalist · Rapper",
    description: "Fierce, fearless, and relentlessly captivating — Pharita brings Thailand's pride to every stage. Her dual mastery of rap and melody makes her one of the most versatile forces in the group.",
    traits: ["Versatile Performer", "High Energy", "Thai Pioneer"],
    photo: "photo-1536766768598-e09213fdcf22",
    accent: "#ff2d2d",
  },
  {
    id: "asa", num: "03", name: "ASA", hangul: "아사",
    birth: "2006 · Apr 17", nationality: "Japan", flag: "🇯🇵",
    position: "Vocalist · Main Dancer",
    description: "Where precision meets artistry — Asa's dance mastery is a study in technique and emotion. Every gesture intentional, every movement a brushstroke. She is the visual pulse of BABYMONSTER.",
    traits: ["Main Dancer", "Precision Artist", "Visual Icon"],
    photo: "photo-1508214751196-bcfd4ca60f91",
    accent: "#cc1a1a",
  },
  {
    id: "ahyeon", num: "04", name: "AHYEON", hangul: "아현",
    birth: "2007 · Apr 11", nationality: "Korea", flag: "🇰🇷",
    position: "Main Rapper · Vocalist",
    description: "Before the official debut, Ahyeon went viral worldwide — proof that true talent cannot be contained. Her rap flows with razor precision while her vocals carry a haunting melodic quality unlike anything in K-pop.",
    traits: ["Main Rapper", "Global Viral", "Genre-Defying"],
    photo: "photo-1524504388940-b1c1722653e1",
    accent: "#E01020",
  },
  {
    id: "rami", num: "05", name: "RAMI", hangul: "라미",
    birth: "2007 · Oct 17", nationality: "Korea", flag: "🇰🇷",
    position: "Vocalist",
    description: "Rami's voice carries a warmth and emotional sincerity that transcends age. When she sings, you feel every word. Her genuine connection with fans has made her one of the most cherished members.",
    traits: ["Pure Vocalist", "Fan Favorite", "Genuine Heart"],
    photo: "photo-1544005313-94ddf0286df2",
    accent: "#ff4040",
  },
  {
    id: "rora", num: "06", name: "RORA", hangul: "로라",
    birth: "2008 · Aug 14", nationality: "Korea", flag: "🇰🇷",
    position: "Performer",
    description: "Rora brings a warm and expressive vocal color to the group.",
    traits: ["Vocal Color", "Warm Tone", "Performer"],
    photo: "photo-1489424731084-a5d8b219a5bb",
    accent: "#b30000",
  },
  {
    id: "chiquita", num: "07", name: "CHIQUITA", hangul: "치키타",
    birth: "2009 · Feb 17", nationality: "Thailand", flag: "🇹🇭",
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

const DEFAULT_SITE_CONTENT: Required<Pick<SiteContent, "siteName" | "siteTagline" | "terms" | "privacy">> = {
  siteName: "MONSTIEZ GLOBAL",
  siteTagline: "BABYMONSTER unofficial global fan community",
  terms: `服務條款

最後更新：2026-08-10

歡迎使用 babymonster.fans。本網站是由粉絲建立的非官方全球粉絲社群，目的在於整理公開資訊、連結官方平台、提供粉絲交流空間。本網站並非 YG Entertainment、BABYMONSTER、其成員或任何權利人之官方網站、代理人或授權代表。

使用本網站即表示你同意遵守本服務條款。若你不同意，請停止使用本網站。

1. 帳號與社群行為
你需對自己帳號下的所有活動負責。請勿冒充官方、藝人、工作人員或其他使用者。禁止發布騷擾、仇恨、威脅、違法、侵犯隱私、未經證實之私生活追蹤資訊、盜版下載連結、惡意程式或垃圾訊息。管理員得依社群安全與法律風險移除內容、限制功能或停用帳號。

2. 使用者內容
你保留自己留言與投稿的權利，但授權本網站在營運、展示、備份、審核、翻譯與改善社群體驗所需範圍內使用該內容。請只發布你有權分享的內容。你不得上傳或提交侵犯第三方著作權、商標權、肖像權、隱私權或其他權利的素材。

3. 第三方內容與官方平台
本網站可能嵌入或連結 Spotify、YouTube、Instagram、Supabase、Google、KakaoTalk 或其他第三方服務。第三方內容與登入流程受其各自條款與隱私政策約束。本網站不提供官方音樂、影片、照片或歌詞之下載，也不主張對 BABYMONSTER 名稱、成員姓名、音樂、影像、標誌或商標擁有權利。

4. 活動與資訊
活動、發行、行程、票務、成員出席及其他資訊可能變更。本網站會盡力標示來源與提醒使用者以官方公告為準，但不保證所有資訊即時、完整或無誤。

5. 免責聲明
本網站以「現況」提供。於法律允許範圍內，本網站不對服務不中斷、資料遺失、第三方服務異常、使用者內容或任何間接損害承擔責任。

6. 條款更新
我們可能因功能、法律或營運需求更新本條款。更新後繼續使用本網站，即表示你接受更新內容。`,
  privacy: `隱私權政策

最後更新：2026-08-10

本政策說明 babymonster.fans 如何處理與保護使用者資訊。本網站是非官方粉絲社群，採用 GitHub Pages 提供靜態網站，並以 Supabase 提供登入、資料庫與社群功能。

1. 我們收集的資訊
當你註冊或登入時，我們可能處理你的電子郵件、暱稱、登入提供者、使用者 ID、角色權限與建立時間。當你使用留言板、按讚、檢舉或管理功能時，我們會儲存你提交的留言、語言、按讚紀錄、檢舉原因、公告或網站內容編輯紀錄。系統也可能由第三方服務處理基本技術資訊，例如 IP 位址、瀏覽器資訊與安全記錄。

2. 使用目的
我們使用資料以提供帳號登入、社群留言、按讚、翻譯、檢舉、管理員審核、網站內容管理、安全防濫用、錯誤排查與法律合規。管理員權限僅用於維護社群秩序與網站內容。

3. 第三方服務
本網站可能使用 Supabase、GitHub Pages、Google OAuth、Kakao OAuth、Spotify Embed、YouTube Embed、Instagram Embed 與翻譯服務。這些服務可能依其政策處理資料。嵌入內容可能讓第三方平台知道你的瀏覽器載入了該內容。

4. Cookie 與本機儲存
本網站與登入服務可能使用 cookie、localStorage 或類似技術維持登入狀態、記住語言偏好並保護服務安全。你可透過瀏覽器設定管理，但部分功能可能因此無法正常使用。

5. 資料分享
除提供服務所必要的第三方供應商、法律要求、保護使用者安全、調查濫用或取得你的同意外，我們不出售你的個人資料。

6. 資料保存與刪除
帳號資料與社群內容會在提供服務所需期間保存。你可聯絡網站管理者請求刪除或更正資料；部分資料可能因安全、備份、法律或爭議處理需要短期保留。

7. 兒少與全球使用者
若你所在司法管轄區要求監護人同意，請先取得同意再使用互動功能。請勿公開自己的住址、電話、學校、即時位置或其他敏感個資。

8. 聯絡方式
若對隱私或資料處理有疑問，請透過本網站公布的管理聯絡方式與站方聯繫。`,
};

function contentText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function contentUrl(value: unknown, fallback: string) {
  return typeof value === "string" && /^https?:\/\//.test(value.trim()) ? value.trim() : fallback;
}

const INITIAL_POSTS = [
  {
    id: 1, author: "MonsterFan_K", initials: "MK", bg: "#E01020",
    time: "2 hours ago",
    content: "AHYEON's rap in DRIP is absolutely devastating 🔥 The way she transitions from rap to vocal in the bridge — sheer genius. Three days on repeat and I'm not sorry.",
    likes: 284, comments: 42, liked: false,
  },
  {
    id: 2, author: "RukaVocalQueen", initials: "RV", bg: "#cc0000",
    time: "4 hours ago",
    content: "Just came back from HELLO MONSTER in Tokyo and I'm not okay 😭 Ruka's live high notes literally defied gravity. Best concert of my entire life without question.",
    likes: 512, comments: 78, liked: false,
  },
  {
    id: 3, author: "BabyMon_TH", initials: "BT", bg: "#b30000",
    time: "6 hours ago",
    content: "The Chiquita × Pharita Thai duo moment during the encore... I was crying in row 3 and feel no shame 🇹🇭❤️ So proud of our Thai monsters on the world stage.",
    likes: 673, comments: 95, liked: false,
  },
  {
    id: 4, author: "AsaDanceArmy", initials: "AD", bg: "#ff1a1a",
    time: "1 day ago",
    content: "Asa's choreography execution in LIKE THAT is criminally underrated. That calm precision while absolutely destroying every move — she is an artist in the truest sense.",
    likes: 891, comments: 134, liked: false,
  },
  {
    id: 5, author: "RamiAngel", initials: "RA", bg: "#990000",
    time: "1 day ago",
    content: "Nobody talks enough about how Rami carried the entire emotional weight of FOREVER. That song makes me cry every single time. Her voice reaches somewhere deep inside you.",
    likes: 743, comments: 112, liked: false,
  },
];

const FALLBACK_API_POSTS: ApiPost[] = INITIAL_POSTS.map(post => ({
  id: -post.id, userId: "demo", nickname: post.author, role: "monstiez", body: post.content,
  sourceLanguage: "en", likes: post.likes, comments: post.comments,
  liked: post.liked, canEdit: false, createdAt: post.time,
}));

// ─────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────

function useAmbientMusic() {
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const start = useCallback(() => {
    if (ctxRef.current) return;
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 3);
      master.connect(ctx.destination);
      gainRef.current = master;

      // Atmospheric Am chord with subtle vibrato
      const layers = [
        { freq: 110, gain: 0.18, type: "sawtooth" as OscillatorType },
        { freq: 220, gain: 0.09, type: "sine" as OscillatorType },
        { freq: 261.63, gain: 0.06, type: "sine" as OscillatorType },
        { freq: 329.63, gain: 0.05, type: "sine" as OscillatorType },
        { freq: 440, gain: 0.04, type: "sine" as OscillatorType },
        { freq: 523.25, gain: 0.02, type: "sine" as OscillatorType },
      ];

      layers.forEach(({ freq, gain: gv, type }, li) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        g.gain.value = gv;
        osc.type = type;
        osc.frequency.value = freq;
        const lfo = ctx.createOscillator();
        const lfoG = ctx.createGain();
        lfo.frequency.value = 0.25 + li * 0.07;
        lfoG.gain.value = 1.2;
        lfo.connect(lfoG);
        lfoG.connect(osc.frequency);
        lfo.start();
        osc.connect(g);
        g.connect(master);
        osc.start();
      });

      setPlaying(true);
      setStarted(true);
    } catch {
      /* audio not supported */
    }
  }, []);

  const toggle = useCallback(() => {
    if (!started) { start(); return; }
    if (!gainRef.current || !ctxRef.current) return;
    const { currentTime } = ctxRef.current;
    if (playing) {
      gainRef.current.gain.linearRampToValueAtTime(0, currentTime + 0.8);
      setTimeout(() => setPlaying(false), 850);
    } else {
      gainRef.current.gain.linearRampToValueAtTime(0.22, currentTime + 1.2);
      setPlaying(true);
    }
  }, [playing, started, start]);

  useEffect(() => () => { if (ctxRef.current && ctxRef.current.state !== "closed") void ctxRef.current.close(); }, []);

  return { playing, toggle };
}

// ─────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────

function Nav({ playing, onToggle, user, locale, siteName, onLocale, onLogin, onLogout, onAdmin }: {
  playing: boolean; onToggle: () => void; user: User | null; locale: Locale; siteName: string;
  onLocale: (locale: Locale) => void; onLogin: () => void; onLogout: () => void; onAdmin: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const t = messages[locale];
  const links = [
    { id: "members", label: t.nav[1] }, { id: "music", label: t.nav[2] },
    { id: "events", label: t.nav[3] }, { id: "community", label: t.nav[4] },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "border-b border-white/5" : ""
      }`}
      style={{ background: scrolled ? "rgba(5,5,5,0.92)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="font-black text-xl tracking-[0.12em] text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {siteName.includes(" ")
            ? <>{siteName.split(" ")[0]}<span style={{ color: "#E01020" }}> {siteName.split(" ").slice(1).join(" ")}</span></>
            : <>BABY<span style={{ color: "#E01020" }}>MONSTER</span></>}
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
          {user?.role === "admin" && <button onClick={onAdmin} className="text-red-400/80 hover:text-red-300" aria-label="Admin dashboard"><Settings size={16} /></button>}
          <button onClick={onToggle}
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors duration-200">
            {playing ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span className="hidden md:inline text-xs tracking-widest uppercase">
              {playing ? t.soundOn : t.soundOff}
            </span>
          </button>
          <button className="md:hidden text-white/70 hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-white/8 px-6 py-5 flex flex-col gap-4"
          style={{ background: "rgba(5,5,5,0.97)" }}>
          {links.map(link => (
            <a key={link.id} href={`#${link.id}`} onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white text-sm tracking-[0.25em] uppercase">
              {link.label}
            </a>
          ))}
          <button onClick={() => { setOpen(false); if (user) onLogout(); else onLogin(); }} className="min-h-11 text-left text-red-400 text-sm tracking-[0.2em] uppercase">
            {user ? `${user.nickname} · ${t.logout}` : t.login}
          </button>
          {user?.role === "admin" && <button onClick={() => { setOpen(false); onAdmin(); }} className="min-h-11 text-left text-white/60 text-sm tracking-[0.2em] uppercase">Admin</button>}
        </motion.div>
      )}
    </nav>
  );
}

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────

function Hero({ playing, onToggle, locale, content }: { playing: boolean; onToggle: () => void; locale: Locale; content: SiteContent }) {
  const t = messages[locale];
  const heroImage = contentUrl(content.heroImageUrl, "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&h=1080&fit=crop&auto=format");
  return (
    <section id="top" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Concert bg */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Concert stage"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full blur-[130px]"
          style={{ background: "rgba(224,16,32,0.18)" }} />
      </div>

      {/* Floating particles */}
      {HERO_PARTICLES.map(p => (
        <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, background: "#E01020" }}
          animate={{ y: [0, -18, 0], opacity: [0.2, 0.9, 0.2], scale: [1, 1.6, 1] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }} />
      ))}

      {/* Main content */}
      <div className="relative z-10 text-center px-4">
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-white/35 text-xs tracking-[0.45em] uppercase mb-8">
          {contentText(content.heroKicker, t.heroKicker)}
        </motion.p>

        {/* BABY — slides up from mask */}
        <div className="overflow-hidden leading-none">
          <motion.div initial={{ y: "110%" }} animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}>
            <span className="font-black text-white block leading-[0.88]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(4.5rem, 18vw, 16rem)" }}>
              BABY
            </span>
          </motion.div>
        </div>

        {/* MONSTER — slides up with offset */}
        <div className="overflow-hidden leading-none -mt-2">
          <motion.div initial={{ y: "110%" }} animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}>
            <span className="font-black block leading-[0.88]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(4.5rem, 18vw, 16rem)", color: "#E01020" }}>
              MONSTER
            </span>
          </motion.div>
        </div>

        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="text-white/50 text-sm md:text-base tracking-[0.35em] uppercase mt-8 mb-14">
          {contentText(content.heroNote, t.heroNote)}
        </motion.p>

        {/* Stat row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.35 }}
          className="flex items-center justify-center gap-10 md:gap-20 mb-16">
          {[{ v: "7", l: t.membersLabel }, { v: "3", l: t.nationalities }, { v: "2024", l: t.debut }].map(({ v, l }) => (
            <div key={l} className="text-center">
              <div className="font-black text-white text-4xl md:text-5xl leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{v}</div>
              <div className="text-white/35 text-xs tracking-widest uppercase mt-1.5">{l}</div>
            </div>
          ))}
        </motion.div>

        {/* Sound toggle */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }} onClick={onToggle}
          className="flex items-center gap-2 mx-auto px-7 py-3 border border-white/15 rounded-full text-white/55 hover:text-white hover:border-white/35 transition-all duration-300 text-xs tracking-[0.2em] uppercase">
          {playing ? <Volume2 size={13} /> : <VolumeX size={13} />}
          {playing ? t.soundOn : t.soundOff}
        </motion.button>
      </div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 2.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-white/25 text-xl" aria-hidden="true">↓</span>
        <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown size={15} className="text-white/25" />
        </motion.div>
      </motion.div>
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

  return (
    <section ref={ref} className="py-32 md:py-44 bg-black relative overflow-hidden">
      <motion.div initial={{ scaleX: 0 }} animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 right-0 h-px origin-left"
        style={{ background: "#E01020" }} />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          {/* Image */}
          <motion.div initial={{ opacity: 0, scale: 0.93, x: -40 }}
            animate={isInView ? { opacity: 1, scale: 1, x: 0 } : {}}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-sm relative bg-neutral-900">
              <img
                src={contentUrl(content.aboutImageUrl, "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=1000&fit=crop&auto=format")}
                alt="BABYMONSTER group performance"
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
          </motion.div>

          {/* Text */}
          <div>
            <motion.span initial={{ opacity: 0, x: 20 }} animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xs tracking-[0.4em] uppercase font-medium" style={{ color: "#E01020" }}>
              {t.storyLabel}
            </motion.span>

            <div className="overflow-hidden mt-4 mb-8">
              <motion.h2 initial={{ y: 80 }} animate={isInView ? { y: 0 } : {}}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-white font-black leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.5rem, 8vw, 7rem)" }}>
                BABY<br /><span style={{ color: "#E01020" }}>MONSTER</span>
              </motion.h2>
            </div>

            <motion.p initial={{ opacity: 0, y: 28 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-white/60 leading-relaxed text-sm md:text-base mb-5">
              {contentText(content.storyLead, t.storyLead)}
            </motion.p>

            <motion.p initial={{ opacity: 0, y: 28 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.52 }}
              className="text-white/40 leading-relaxed text-sm mb-12">
              {contentText(content.storyBody, t.storyBody)}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 28 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
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
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// MEMBER SPOTLIGHT (individual)
// ─────────────────────────────────────────────

function MemberSpotlight({ member, index, biography, photoUrl }: { member: typeof MEMBERS[0]; index: number; biography: string; photoUrl?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });
  const isEven = index % 2 === 0;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const visualScale = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [0.82, 1, 1.04, 1.12]);
  const visualOpacity = useTransform(scrollYProgress, [0, 0.16, 0.8, 1], [0, 1, 1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [110, 0, 0, -90]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.2, 0.82, 1], [0, 1, 1, 0]);
  const progressX = useTransform(scrollYProgress, [0.12, 0.88], [0, 1]);

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
          <motion.div style={{ scale: visualScale, opacity: visualOpacity }}
            className={!isEven ? "md:order-last" : ""}>
            <div className="aspect-[3/4] max-w-sm mx-auto relative overflow-hidden rounded-sm bg-neutral-900 group">
              <img
                src={contentUrl(photoUrl, `https://images.unsplash.com/${member.photo}?w=600&h=800&fit=crop&auto=format&q=90`)}
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
                <div className="text-white/60 text-xs tracking-[0.3em] uppercase mb-1">{member.flag} {member.nationality}</div>
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
          <motion.div style={{ y: copyY, opacity: copyOpacity }}>
            {/* Index + divider */}
            <motion.div initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-3 mb-6">
              <span className="font-black text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: member.accent }}>
                {member.num}
              </span>
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-white/25 text-xs tracking-widest uppercase">{member.nationality}</span>
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
              <span className="text-white/30 text-xl">{member.hangul}</span>
              <span className="w-1 h-1 rounded-full" style={{ background: member.accent }} />
              <span className="text-white/40 text-sm tracking-wider">{member.birth}</span>
            </motion.div>

            {/* Description */}
            <motion.p initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.58 }}
              className="text-white/55 leading-relaxed text-sm md:text-base mb-8">
              {biography}
            </motion.p>

          </motion.div>
        </div>
      </div>
    </div>
  );
}

function MembersSection({ locale, content }: { locale: Locale; content: SiteContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const t = messages[locale];

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

      {MEMBERS.map((m, i) => <MemberSpotlight key={m.id} member={m} index={i} biography={memberBios[locale][i]} photoUrl={content.memberPhotos?.[m.id]} />)}
    </section>
  );
}

// ─────────────────────────────────────────────
// ALBUM CARD
// ─────────────────────────────────────────────

function AlbumCard({ album, index, isVisible, locale }: { album: typeof ALBUMS[0]; index: number; isVisible: boolean; locale: Locale }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.85, delay: 0.2 + index * 0.13, ease: [0.16, 1, 0.3, 1] }}
      className="group cursor-pointer"
      onClick={() => setExpanded(!expanded)}>
      <div className="relative aspect-square overflow-hidden rounded-sm mb-5 bg-neutral-900">
        <img
          src={`https://images.unsplash.com/${album.photo}?w=600&h=600&fit=crop&auto=format`}
          alt={album.title}
          className="w-full h-full object-cover transition-all duration-[1200ms] group-hover:scale-105"
          style={{ filter: "grayscale(20%) contrast(1.12) brightness(0.72)" }}
        />
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

      <div className="text-xs tracking-[0.3em] uppercase mb-1" style={{ color: "#E01020" }}>{messages[locale].streamsLabel}</div>
      <div className="text-white font-black text-3xl leading-none mb-2 transition-colors duration-300 group-hover:text-red-400"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        {album.title}
      </div>
      <div className="text-white/40 text-sm leading-relaxed">{messages[locale].streamsLead}</div>

      {/* Track list */}
      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="mt-5 border-t border-white/8 pt-4 overflow-hidden">
          {album.tracks.map((t, ti) => (
            <div key={t} className="flex items-center gap-3 py-2 text-white/45 hover:text-white transition-colors duration-200 group/t">
              <span className="text-xs text-white/20 w-4 text-right shrink-0">{ti + 1}</span>
              <Music size={11} style={{ color: "#E01020", opacity: 0.6 }} />
              <span className="text-sm tracking-wide flex-1">{t}</span>
              <Play size={11} className="text-red-600 opacity-0 group-hover/t:opacity-100 transition-opacity shrink-0" />
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function MusicSection({ locale }: { locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const t = messages[locale];

  return (
    <section id="music" className="bg-black py-24 md:py-44 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={ref} className="mb-20">
          <motion.span initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}
            className="text-xs tracking-[0.4em] uppercase" style={{ color: "#E01020" }}>
            {t.streamsLabel}
          </motion.span>
          <div className="overflow-hidden mt-4">
            <motion.h2 initial={{ y: 80 }} animate={isInView ? { y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-black leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.5rem, 10vw, 9rem)" }}>
              BABYMONSTER<br /><span style={{ color: "#E01020" }}>MUSIC</span>
            </motion.h2>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {ALBUMS.map((a, i) => <AlbumCard key={a.id} album={a} index={i} isVisible={isInView} locale={locale} />)}
        </div>

        <div className="grid md:grid-cols-[1.4fr_.6fr] gap-8 mt-16">
          <div className="border border-white/8 rounded-sm p-3" style={{ background: "rgba(255,255,255,0.018)" }}>
            <iframe title="BABYMONSTER on Spotify" className="w-full rounded-sm" src="https://open.spotify.com/embed/artist/1SIocsqdEefUTE6XKGUiVS?utm_source=generator&theme=0" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
          </div>
          <div className="grid gap-4">
            <a href="https://www.youtube.com/@BABYMONSTER" target="_blank" rel="noreferrer" className="border border-white/8 rounded-sm p-6 flex flex-col justify-between hover:border-red-600/30 transition-colors">
              <span className="text-white/35 text-xs tracking-[.3em] uppercase">{t.officialChannel}</span><strong className="text-white text-3xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>YOUTUBE ↗</strong>
            </a>
            <a href="https://www.instagram.com/babymonster_ygofficial/" target="_blank" rel="noreferrer" className="border border-white/8 rounded-sm p-6 flex flex-col justify-between hover:border-red-600/30 transition-colors">
              <span className="text-white/35 text-xs tracking-[.3em] uppercase">{t.officialProfile}</span><strong className="text-white text-3xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>INSTAGRAM ↗</strong>
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

function EventCard({ event, index, locale }: { event: EditableEvent; index: number; locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const isLeft = index % 2 === 0;
  const t = messages[locale];
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
        <div className={`w-3 h-3 rounded-full ${event.status === "upcoming" ? "" : "bg-white/20"}`}
          style={event.status === "upcoming" ? { background: "#E01020" } : {}} />
        {event.status === "upcoming" && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: "#E01020" }} />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 38, x: isLeft ? -24 : 24 }}
        animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className={`border border-white/8 rounded-sm p-6 hover:border-red-600/25 transition-colors duration-300 group ${isLeft ? "md:mr-8" : "md:ml-8"}`}
        style={{ background: "rgba(255,255,255,0.018)" }}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <span className={`text-xs tracking-[0.3em] uppercase px-2 py-0.5 rounded ${
            event.status === "upcoming"
              ? "text-red-400 border border-red-800/30"
              : "text-white/30 bg-white/5"
          }`}
            style={event.status === "upcoming" ? { background: "rgba(224,16,32,0.1)" } : {}}>
            {event.status === "upcoming" ? messages[locale].latestNews : messages[locale].verifyOfficial}
          </span>
          <span className="text-white/25 text-xs tracking-wider">{messages[locale].eventsLabel}</span>
        </div>

        <h3 className="text-white font-black text-2xl md:text-3xl leading-tight mb-1 group-hover:text-red-400 transition-colors duration-300"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {contentText(event.title, localizedTitle)}
        </h3>
        <p className="text-white/35 text-xs tracking-widest uppercase mb-4">{contentText(event.sub, t.verifyOfficial)}</p>
        <p className="text-white/50 text-sm mb-5">{contentText(event.desc, messages[locale].eventsLead)}</p>

        <div className="flex flex-wrap gap-5 text-xs text-white/35">
          <span className="flex items-center gap-1.5">
            <Calendar size={11} style={{ color: "rgba(224,16,32,0.6)" }} />
            {event.dates}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={11} style={{ color: "rgba(224,16,32,0.6)" }} />
            {event.locations}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function EventsSection({ locale, content }: { locale: Locale; content: SiteContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const t = messages[locale];
  const events = Array.isArray(content.events) && content.events.length ? content.events : EVENTS;

  return (
    <section id="events" className="bg-black py-24 md:py-44 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={ref} className="mb-20">
          <motion.span initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}
            className="text-xs tracking-[0.4em] uppercase" style={{ color: "#E01020" }}>
            {t.eventsLabel}
          </motion.span>
          <div className="overflow-hidden mt-4">
            <motion.h2 initial={{ y: 80 }} animate={isInView ? { y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-black leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.5rem, 10vw, 9rem)" }}>
              BABYMONSTER<br /><span style={{ color: "#E01020" }}>{t.eventsLabel}</span>
            </motion.h2>
          </div>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-white/8" />
          <div className="space-y-14">
            {events.map((e, i) => <EventCard key={`${e.title}-${i}`} event={e} index={i} locale={locale} />)}
          </div>
        </div>
      </div>
    </section>
  );
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
  const [showOriginal, setShowOriginal] = useState(false);
  const t = messages[locale];

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
  async function reportPost() { try { await reportFanPost(post.id); } catch { /* retain post when reporting is unavailable */ } }
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
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: ["#E01020", "#cc0000", "#b30000", "#ff2d2d"][Math.abs(post.id) % 4] }}>
          {post.nickname.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium text-sm">{post.nickname}{post.role !== "monstiez" && <span className={`ml-2 ${post.role === "admin" ? "text-red-400" : "text-blue-400"}`} title={post.role === "admin" ? t.roleAdmin : t.roleArtist}>✓<span className="sr-only">{post.role === "admin" ? t.roleAdmin : t.roleArtist}</span></span>}</span>
            <span className="text-white/22 text-xs">{post.createdAt} · {post.sourceLanguage}</span>
          </div>
          <p className="text-white/62 text-sm leading-relaxed">{copy}</p>
          {post.sourceLanguage !== locale && <button onClick={() => setShowOriginal(value => !value)} className="mt-2 text-red-400/70 text-xs hover:text-red-300">{showOriginal ? t.hideOriginal : t.original}</button>}
          {showOriginal && <p className="mt-2 pl-3 border-l border-white/15 text-white/35 text-xs leading-relaxed">{post.body}</p>}
          <div className="flex flex-wrap items-center gap-5 mt-4">
            <button onClick={() => onLike(post)}
              className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                post.liked ? "text-red-500" : "text-white/28 hover:text-white/60"
              }`}>
              <Heart size={13} fill={post.liked ? "currentColor" : "none"} />
              {post.likes}
            </button>
            <button className="flex items-center gap-1.5 text-xs text-white/28 hover:text-white/55 transition-colors duration-200">
              <MessageCircle size={13} />
              {post.comments}
            </button>
            {post.canEdit && <button onClick={editPost} className="text-white/28 hover:text-white/60 text-xs">{t.edit}</button>}
            {post.canEdit && <button onClick={removePost} className="text-white/28 hover:text-red-400 text-xs">{t.remove}</button>}
            {user && post.id > 0 && <button onClick={reportPost} className="text-white/28 hover:text-white/60 text-xs">{t.report}</button>}
            {user?.role === "admin" && <button onClick={moderatePost} className="text-red-400/70 hover:text-red-300 text-xs">{t.moderate}</button>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CommunitySection({ user, locale, onLogin }: { user: User | null; locale: Locale; onLogin: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.12 });
  const [posts, setPosts] = useState<ApiPost[]>(FALLBACK_API_POSTS);
  const [body, setBody] = useState("");
  const t = messages[locale];

  const refresh = useCallback(() => {
    listFanPosts(user).then(data => setPosts(data.length ? data : FALLBACK_API_POSTS)).catch(() => setPosts(FALLBACK_API_POSTS));
  }, [user]);

  useEffect(() => { refresh(); const timer = window.setInterval(refresh, 10_000); return () => window.clearInterval(timer); }, [refresh]);

  const handleLike = async (post: ApiPost) => {
    if (!user) { onLogin(); return; }
    if (post.id < 0) return;
    try {
      await toggleFanLike(post.id, post.liked);
      setPosts(items => items.map(item => item.id === post.id ? { ...item, likes: item.likes + (item.liked ? -1 : 1), liked: !item.liked } : item));
    } catch { /* keep existing count when offline */ }
  };

  const submit = async () => {
    if (!user) { onLogin(); return; }
    if (!body.trim()) return;
    try { await createFanPost(body.trim(), locale); setBody(""); refresh(); } catch { /* input remains available for retry */ }
  };

  return (
    <section id="community" className="bg-black py-24 md:py-44 border-t border-white/5">
      <div className="max-w-3xl mx-auto px-6">
        <div ref={ref} className="mb-16">
          <motion.span initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}
            className="text-xs tracking-[0.4em] uppercase" style={{ color: "#E01020" }}>
            {t.communityLabel}
          </motion.span>
          <div className="overflow-hidden mt-4">
            <motion.h2 initial={{ y: 80 }} animate={isInView ? { y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-black leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.5rem, 10vw, 9rem)" }}>
              MONSTIEZ<br /><span style={{ color: "#E01020" }}>{t.communityTitle}</span>
            </motion.h2>
          </div>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.42 }}
            className="text-white/35 text-sm mt-5 tracking-wide">
            {t.communityLead}
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
            <button onClick={() => void submit()} disabled={Boolean(user) && !body.trim()}
              className="flex items-center gap-2 px-5 py-2 text-white text-xs tracking-widest uppercase font-medium transition-colors duration-200 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "#E01020" }}
              onMouseEnter={e => { if (body.trim()) (e.currentTarget as HTMLButtonElement).style.background = "#c00e1c"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#E01020"; }}>
              <Send size={12} /> {user ? t.publish : t.login}
            </button>
          </div>
        </motion.div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((p, i) => <PostCard key={p.id} post={p} index={i} onLike={handleLike} onRefresh={refresh} user={user} locale={locale} />)}
        </div>
      </div>
    </section>
  );
}

function FanVoices({ locale, user }: { locale: Locale; user: User | null }) {
  const [posts, setPosts] = useState<ApiPost[]>(FALLBACK_API_POSTS);
  useEffect(() => { void listFanPosts(user).then(rows => rows.length && setPosts(rows)).catch(() => {}); }, [user]);
  const loop = [...posts.slice(0, 6), ...posts.slice(0, 6)];
  return <section className="voices-section" aria-labelledby="fan-voices-title">
    <div className="max-w-7xl mx-auto px-6"><p className="text-xs tracking-[0.4em] uppercase text-[#E01020]" id="fan-voices-title">{messages[locale].fanVoices}</p></div>
    <div className="voices-viewport"><div className="voices-track">{loop.map((post, index) => <blockquote key={`${post.id}-${index}`}><p>“{post.body}”</p><footer>{post.nickname} · {post.sourceLanguage}</footer></blockquote>)}</div></div>
  </section>;
}

function Announcements({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<Array<{ id: number; title: string; body: string; published_at: string }>>([]);
  const t = messages[locale];
  useEffect(() => { void listAnnouncements(locale).then(setItems).catch(() => setItems([])); }, [locale]);
  const rows = items.length ? items : [{ id: -1, title: t.announcementFallbackTitle, body: t.announcementFallbackBody, published_at: "2026-08-10" }];
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
        <button onClick={onClose} className="text-white/50 hover:text-white text-2xl" aria-label="Close">×</button>
      </div>
      <div className="whitespace-pre-wrap text-white/58 text-sm leading-7">{body}</div>
    </div>
  </div>;
}

function Footer({ locale, content, onLegal }: { locale: Locale; content: SiteContent; onLegal: (kind: "terms" | "privacy") => void }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const t = messages[locale];
  const links = [{ id: "members", label: t.nav[1] }, { id: "music", label: t.nav[2] }, { id: "events", label: t.nav[3] }, { id: "community", label: t.nav[4] }];
  const siteName = contentText(content.siteName, DEFAULT_SITE_CONTENT.siteName);

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
              {contentText(content.siteTagline, DEFAULT_SITE_CONTENT.siteTagline)}<br />
              {contentText(content.heroNote, t.heroNote)}
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
            <div className="text-white/45 text-xs tracking-[0.3em] uppercase mb-4">MONSTIEZ GLOBAL</div>
            <p className="text-white/22 text-xs leading-relaxed">
              {t.streamsLead}
            </p>
          </motion.div>
        </div>

        <div className="border-t border-white/5 pt-8 flex items-center justify-between">
          <span className="text-white/18 text-xs">© 2026 babymonster.fans</span>
          <div className="flex flex-wrap items-center justify-end gap-4">
            <button onClick={() => onLegal("terms")} className="text-white/28 hover:text-white text-xs tracking-widest">服務條款</button>
            <button onClick={() => onLegal("privacy")} className="text-white/28 hover:text-white text-xs tracking-widest">隱私權政策</button>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#E01020" }} />
            <span className="text-white/18 text-xs tracking-widest">MONSTERS FOREVER</span>
          </div>
        </div>
        <p className="mt-8 pt-6 border-t border-white/5 text-white/25 text-xs leading-relaxed">{t.warning}</p>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// AUDIO PLAYER BAR
// ─────────────────────────────────────────────

function AudioPlayerBar({ playing, onToggle, locale }: { playing: boolean; onToggle: () => void; locale: Locale }) {
  const t = messages[locale];
  return (
    <motion.div initial={{ y: 72 }} animate={{ y: 0 }}
      transition={{ delay: 2.8, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/8 pb-[env(safe-area-inset-bottom)]"
      style={{ background: "rgba(4,4,4,0.96)", backdropFilter: "blur(24px)" }}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
        <button onClick={onToggle}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-opacity duration-200 hover:opacity-80"
          style={{ background: "#E01020" }}>
          {playing
            ? <Pause size={13} className="text-white" />
            : <Play size={13} className="text-white ml-0.5" />}
        </button>

        {/* Waveform */}
        <div className="flex items-center gap-px h-7">
          {WAVEFORM.map((maxH, i) => (
            <motion.div key={i}
              className="w-[2px] rounded-full transition-colors duration-300"
              style={{ backgroundColor: playing ? "#E01020" : "rgba(255,255,255,0.15)" }}
              animate={playing ? { height: ["4px", `${maxH}px`, "4px"] } : { height: "4px" }}
              transition={playing
                ? { duration: 0.42 + (i % 5) * 0.09, repeat: Infinity, delay: i * 0.028, ease: "easeInOut" }
                : { duration: 0.3 }} />
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-medium truncate">BABYMONSTER — DRIP</div>
          <div className="text-white/28 text-xs truncate">{playing ? t.soundOn : t.soundOff}</div>
        </div>

        {playing
          ? <Volume2 size={14} className="text-white/35 shrink-0" />
          : <VolumeX size={14} className="text-white/25 shrink-0" />}
      </div>
    </motion.div>
  );
}

function OpeningLoader({ siteName }: { siteName: string }) {
  return <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } }}
    className="fixed inset-0 z-[200] bg-black overflow-hidden grid place-items-center"
    role="status"
    aria-live="polite"
    aria-label="Loading BABYMONSTER fan site">
    <div className="absolute inset-0">
      <motion.div
        className="absolute left-0 right-0 top-1/2 h-px bg-[#E01020]"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1, 1], opacity: [0, 1, 0.35] }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "left" }} />
      <motion.div
        className="absolute -left-1/4 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-red-700/18 to-transparent skew-x-[-18deg]"
        animate={{ x: ["0%", "260%"] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(224,16,32,0.18),transparent_34%),linear-gradient(180deg,transparent,rgba(0,0,0,0.88))]" />
    </div>

    <div className="relative z-10 text-center px-6">
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="text-white/35 text-xs tracking-[0.5em] uppercase mb-5">
        MONSTIEZ SIGNAL
      </motion.p>
      <div className="overflow-hidden">
        <motion.h1
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="text-white font-black leading-[0.82]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(3.8rem, 14vw, 12rem)" }}>
          {siteName}
        </motion.h1>
      </div>
      <div className="mt-9 h-1 w-56 mx-auto bg-white/10 overflow-hidden">
        <motion.div
          className="h-full bg-[#E01020]"
          initial={{ x: "-100%" }}
          animate={{ x: ["-100%", "120%"] }}
          transition={{ duration: 1.05, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }} />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.25, 0.8, 0.25] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="mt-5 text-white/28 text-xs tracking-[0.35em] uppercase">
        Loading official links · fan voices · stage data
      </motion.div>
    </div>
  </motion.div>;
}

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────

function AdminPanel({ content, onSaved, onClose }: { content: SiteContent; onSaved: (content: SiteContent) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<SiteContent>(() => ({
    ...content,
    siteName: contentText(content.siteName, DEFAULT_SITE_CONTENT.siteName),
    siteTagline: contentText(content.siteTagline, DEFAULT_SITE_CONTENT.siteTagline),
    terms: contentText(content.terms, DEFAULT_SITE_CONTENT.terms),
    privacy: contentText(content.privacy, DEFAULT_SITE_CONTENT.privacy),
    memberPhotos: { ...(content.memberPhotos || {}) },
    events: Array.isArray(content.events) && content.events.length ? content.events : EVENTS,
  }));
  const [feedback, setFeedback] = useState("");

  function update<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setDraft(current => ({ ...current, [key]: value }));
  }

  function updateMemberPhoto(memberId: string, value: string) {
    setDraft(current => ({ ...current, memberPhotos: { ...(current.memberPhotos || {}), [memberId]: value } }));
  }

  function updateEvent(index: number, key: keyof EditableEvent, value: string) {
    setDraft(current => {
      const events = [...(current.events || EVENTS)];
      events[index] = { ...events[index], [key]: key === "status" && value !== "past" ? "upcoming" : value } as EditableEvent;
      return { ...current, events };
    });
  }

  function addEvent() {
    setDraft(current => ({
      ...current,
      events: [...(current.events || EVENTS), { title: "New activity", sub: "Official update", dates: "TBA", locations: "Official channels", type: "News", status: "upcoming", desc: "Confirm details with official announcements." }],
    }));
  }

  function removeEvent(index: number) {
    setDraft(current => ({ ...current, events: (current.events || EVENTS).filter((_, eventIndex) => eventIndex !== index) }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("Saving...");
    try {
      await saveSiteContent(draft);
      onSaved(draft);
      setFeedback("Saved. Public pages will use the new content immediately.");
    } catch (error) {
      setFeedback(error instanceof Error && error.message !== "SUPABASE_NOT_CONFIGURED" ? error.message : "Supabase is not configured or your account is not admin.");
    }
  }

  const inputClass = "mt-2 w-full bg-black border border-white/15 p-3 text-white/75 text-sm focus:outline-none focus:border-red-600/60";
  const labelClass = "block text-white/45 text-xs tracking-wider";
  const events = draft.events || EVENTS;

  return <div className="fixed inset-0 z-[105] bg-black/88 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Admin dashboard">
    <form onSubmit={submit} className="w-full max-w-5xl max-h-[92vh] overflow-auto bg-[#090909] border border-white/15 p-6 md:p-8 shadow-2xl">
      <div className="flex items-start justify-between gap-5 mb-7">
        <div>
          <p className="text-red-400 text-xs tracking-[0.35em] uppercase mb-2">Admin CMS</p>
          <h2 className="text-white font-black text-4xl md:text-5xl leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>SITE CONTENT</h2>
        </div>
        <button type="button" onClick={onClose} className="text-white/50 hover:text-white text-2xl" aria-label="Close">×</button>
      </div>

      <div className="grid gap-8">
        <section className="border-t border-white/8 pt-6">
          <h3 className="text-white font-bold mb-4">網站名稱與 Icon</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <label className={labelClass}>網站名稱<input value={draft.siteName || ""} onChange={e => update("siteName", e.target.value)} className={inputClass} /></label>
            <label className={labelClass}>網站短標語<input value={draft.siteTagline || ""} onChange={e => update("siteTagline", e.target.value)} className={inputClass} /></label>
            <label className={labelClass}>Favicon / icon URL<input value={draft.faviconUrl || ""} onChange={e => update("faviconUrl", e.target.value)} placeholder="https://..." className={inputClass} /></label>
            <label className={labelClass}>社群分享圖片 URL<input value={draft.ogImageUrl || ""} onChange={e => update("ogImageUrl", e.target.value)} placeholder="https://..." className={inputClass} /></label>
          </div>
        </section>

        <section className="border-t border-white/8 pt-6">
          <h3 className="text-white font-bold mb-4">首頁與介紹</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <label className={labelClass}>Hero 小標<input value={draft.heroKicker || ""} onChange={e => update("heroKicker", e.target.value)} className={inputClass} /></label>
            <label className={labelClass}>Hero 背景圖片 URL<input value={draft.heroImageUrl || ""} onChange={e => update("heroImageUrl", e.target.value)} placeholder="https://..." className={inputClass} /></label>
            <label className={`${labelClass} md:col-span-2`}>Hero 文字<textarea rows={3} value={draft.heroNote || ""} onChange={e => update("heroNote", e.target.value)} className={inputClass} /></label>
            <label className={labelClass}>介紹圖片 URL<input value={draft.aboutImageUrl || ""} onChange={e => update("aboutImageUrl", e.target.value)} placeholder="https://..." className={inputClass} /></label>
            <label className={labelClass}>介紹短文<textarea rows={4} value={draft.storyLead || ""} onChange={e => update("storyLead", e.target.value)} className={inputClass} /></label>
            <label className={`${labelClass} md:col-span-2`}>完整介紹<textarea rows={5} value={draft.storyBody || ""} onChange={e => update("storyBody", e.target.value)} className={inputClass} /></label>
          </div>
        </section>

        <section className="border-t border-white/8 pt-6">
          <h3 className="text-white font-bold mb-4">成員圖片 URL</h3>
          <p className="text-white/35 text-xs leading-relaxed mb-4">建議使用官方允許 embed 的內容、授權素材、自己拍攝或粉絲授權圖片。不要直接抓未授權官方照或 Google 圖片。</p>
          <div className="grid md:grid-cols-2 gap-4">
            {MEMBERS.map(member => <label key={member.id} className={labelClass}>{member.name}<input value={draft.memberPhotos?.[member.id] || ""} onChange={e => updateMemberPhoto(member.id, e.target.value)} placeholder="https://..." className={inputClass} /></label>)}
          </div>
        </section>

        <section className="border-t border-white/8 pt-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-white font-bold">近期活動</h3>
            <button type="button" onClick={addEvent} className="px-3 py-2 border border-white/15 text-white/60 text-xs hover:text-white">新增活動</button>
          </div>
          <div className="grid gap-4">
            {events.map((event, index) => <div key={`${event.title}-${index}`} className="border border-white/8 p-4">
              <div className="grid md:grid-cols-2 gap-3">
                <label className={labelClass}>標題<input value={event.title} onChange={e => updateEvent(index, "title", e.target.value)} className={inputClass} /></label>
                <label className={labelClass}>副標<input value={event.sub} onChange={e => updateEvent(index, "sub", e.target.value)} className={inputClass} /></label>
                <label className={labelClass}>日期<input value={event.dates} onChange={e => updateEvent(index, "dates", e.target.value)} className={inputClass} /></label>
                <label className={labelClass}>地點<input value={event.locations} onChange={e => updateEvent(index, "locations", e.target.value)} className={inputClass} /></label>
                <label className={labelClass}>狀態<select value={event.status} onChange={e => updateEvent(index, "status", e.target.value)} className={inputClass}><option value="upcoming">upcoming</option><option value="past">past</option></select></label>
                <label className={labelClass}>類型<input value={event.type} onChange={e => updateEvent(index, "type", e.target.value)} className={inputClass} /></label>
                <label className={`${labelClass} md:col-span-2`}>說明<textarea rows={3} value={event.desc} onChange={e => updateEvent(index, "desc", e.target.value)} className={inputClass} /></label>
              </div>
              <button type="button" onClick={() => removeEvent(index)} className="mt-3 text-red-400/70 hover:text-red-300 text-xs">刪除這筆活動</button>
            </div>)}
          </div>
        </section>

        <section className="border-t border-white/8 pt-6">
          <h3 className="text-white font-bold mb-4">服務條款與隱私權</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <label className={labelClass}>服務條款<textarea rows={12} value={draft.terms || ""} onChange={e => update("terms", e.target.value)} className={inputClass} /></label>
            <label className={labelClass}>隱私權政策<textarea rows={12} value={draft.privacy || ""} onChange={e => update("privacy", e.target.value)} className={inputClass} /></label>
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 mt-8 -mx-6 md:-mx-8 -mb-6 md:-mb-8 border-t border-white/10 bg-[#090909]/95 backdrop-blur px-6 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-white/35 text-xs">{feedback || "只有 Supabase role=admin 的帳號能儲存。"}</p>
        <button type="submit" className="inline-flex items-center gap-2 px-5 py-3 bg-[#E01020] text-white text-xs tracking-[0.2em] uppercase"><Save size={14} />儲存變更</button>
      </div>
    </form>
  </div>;
}

function AuthModal({ locale, mode, onMode, onClose, onAuthenticated }: {
  locale: Locale; mode: "login" | "register"; onMode: (mode: "login" | "register") => void;
  onClose: () => void; onAuthenticated: (user: User) => void;
}) {
  const [feedback, setFeedback] = useState("");
  const t = messages[locale];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFeedback("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const user = await emailAuth(mode, String(payload.email || ""), String(payload.password || ""), String(payload.nickname || ""));
      if (user) { onAuthenticated(user); onClose(); }
      else setFeedback(t.successLogin);
    } catch (error) { setFeedback(error instanceof Error && error.message !== "SUPABASE_NOT_CONFIGURED" ? error.message : t.genericError); }
  }
  async function oauth(provider: "google" | "kakao") {
    setFeedback("");
    try { await socialAuth(provider); } catch (error) { setFeedback(error instanceof Error ? error.message : t.genericError); }
  }
  return <div className="fixed inset-0 z-[100] bg-black/85 grid place-items-center p-5" role="dialog" aria-modal="true" aria-label={t.login}>
    <div className="w-full max-w-lg max-h-[92vh] overflow-auto bg-[#090909] border border-white/15 p-7 shadow-2xl">
      <div className="flex items-center justify-between"><h2 className="text-white font-black text-4xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>JOIN <span className="text-[#E01020]">MONSTIEZ</span></h2><button onClick={onClose} className="text-white/50 hover:text-white text-2xl" aria-label={t.close}>×</button></div>
      <div className="grid grid-cols-2 border-b border-white/10 my-6"><button onClick={() => onMode("login")} className={`py-3 text-sm ${mode === "login" ? "text-white border-b-2 border-red-600" : "text-white/35"}`}>{t.loginTab}</button><button onClick={() => onMode("register")} className={`py-3 text-sm ${mode === "register" ? "text-white border-b-2 border-red-600" : "text-white/35"}`}>{t.registerTab}</button></div>
      <div className="grid grid-cols-2 gap-2"><button onClick={() => void oauth("google")} className="min-h-11 border border-white/15 p-3 text-center text-white/60 text-xs">Google</button><button onClick={() => void oauth("kakao")} className="min-h-11 border border-white/15 p-3 text-center text-white/60 text-xs">KakaoTalk</button></div>
      <div className="text-center text-white/25 text-xs my-5">— {t.orEmail} —</div>
      <form onSubmit={submit} className="grid gap-4">
        {mode === "register" && <label className="text-white/45 text-xs">{t.nickname}<input name="nickname" required minLength={2} maxLength={24} className="block w-full mt-2 p-3 bg-black border border-white/15 text-white focus:outline-none focus:border-red-600/60" /></label>}
        <label className="text-white/45 text-xs">{t.email}<input name="email" type="email" required className="block w-full mt-2 p-3 bg-black border border-white/15 text-white focus:outline-none focus:border-red-600/60" /></label>
        <label className="text-white/45 text-xs">{t.password}<input name="password" type="password" required minLength={10} className="block w-full mt-2 p-3 bg-black border border-white/15 text-white focus:outline-none focus:border-red-600/60" /></label>
        <button type="submit" className="p-4 bg-[#E01020] text-white text-xs tracking-[.2em] uppercase">{mode === "register" ? t.createAccount : t.loginBoard}</button>
      </form>
      {feedback && <p className="text-red-400 text-xs mt-4">{feedback}</p>}
    </div>
  </div>;
}

export default function App() {
  const { playing, toggle } = useAmbientMusic();
  const [user, setUser] = useState<User | null>(null);
  const [locale, setLocale] = useState<Locale>("zh-TW");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [adminOpen, setAdminOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState<"terms" | "privacy" | null>(null);
  const [siteContent, setSiteContent] = useState<SiteContent>({});
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const next = getInitialLocale(navigator.languages, localStorage.getItem("monstiez-locale"));
    queueMicrotask(() => setLocale(next)); document.documentElement.lang = next;
    let active = true;
    const startedAt = Date.now();
    void Promise.all([currentFanUser(), loadSiteContent()])
      .then(([nextUser, nextContent]) => {
        if (!active) return;
        setUser(nextUser);
        setSiteContent(nextContent);
      })
      .finally(() => {
        const delay = Math.max(0, 1350 - (Date.now() - startedAt));
        window.setTimeout(() => { if (active) setBooting(false); }, delay);
      });
    const unsubscribe = observeFanUser(value => { if (active) setUser(value); });
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    const siteName = contentText(siteContent.siteName, DEFAULT_SITE_CONTENT.siteName);
    const tagline = contentText(siteContent.siteTagline, DEFAULT_SITE_CONTENT.siteTagline);
    document.title = `${siteName}｜${tagline}`;
    const faviconUrl = contentUrl(siteContent.faviconUrl, "/favicon.svg");
    let icon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.href = faviconUrl;
    const description = document.querySelector<HTMLMetaElement>("meta[name='description']");
    if (description) description.content = tagline;
    const ogImage = document.querySelector<HTMLMetaElement>("meta[property='og:image']");
    if (ogImage && siteContent.ogImageUrl) ogImage.content = siteContent.ogImageUrl;
  }, [siteContent]);

  function changeLocale(next: Locale) { setLocale(next); localStorage.setItem("monstiez-locale", next); document.documentElement.lang = next; }
  async function logout() { await signOutFan(); setUser(null); }

  useEffect(() => {
    // Hide scrollbar
    const style = document.createElement("style");
    style.textContent = `::-webkit-scrollbar{display:none}body{scrollbar-width:none;-ms-overflow-style:none}`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="bg-black min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      {booting && <OpeningLoader siteName={contentText(siteContent.siteName, DEFAULT_SITE_CONTENT.siteName)} />}
      <Nav playing={playing} onToggle={toggle} user={user} locale={locale} siteName={contentText(siteContent.siteName, DEFAULT_SITE_CONTENT.siteName)} onLocale={changeLocale} onLogin={() => setAuthOpen(true)} onLogout={logout} onAdmin={() => setAdminOpen(true)} />
      <Hero playing={playing} onToggle={toggle} locale={locale} content={siteContent} />
      <AboutSection locale={locale} content={siteContent} />
      <MembersSection locale={locale} content={siteContent} />
      <MusicSection locale={locale} />
      <EventsSection locale={locale} content={siteContent} />
      <CommunitySection user={user} locale={locale} onLogin={() => setAuthOpen(true)} />
      <FanVoices locale={locale} user={user} />
      <Announcements locale={locale} />
      <Footer locale={locale} content={siteContent} onLegal={setLegalOpen} />
      <AudioPlayerBar playing={playing} onToggle={toggle} locale={locale} />
      {authOpen && <AuthModal locale={locale} mode={authMode} onMode={setAuthMode} onClose={() => setAuthOpen(false)} onAuthenticated={setUser} />}
      {adminOpen && user?.role === "admin" && <AdminPanel content={siteContent} onSaved={setSiteContent} onClose={() => setAdminOpen(false)} />}
      {legalOpen && <LegalModal title={legalOpen === "terms" ? "服務條款" : "隱私權政策"} body={contentText(siteContent[legalOpen], DEFAULT_SITE_CONTENT[legalOpen])} onClose={() => setLegalOpen(null)} />}
      {/* Spacer for fixed audio bar */}
      <div className="h-[calc(3.5rem+env(safe-area-inset-bottom))]" />
    </div>
  );
}
