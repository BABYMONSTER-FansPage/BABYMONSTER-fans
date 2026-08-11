"use client";

import { FormEvent, useEffect, useState } from "react";

type User = { id: number; nickname: string; email?: string };
type Post = { id: number; nickname: string; body: string; likes: number; comments: number; liked?: boolean; createdAt: string };

const members = [
  ["01", "RUKA", "2002.03.20", "日本", "舞台上以俐落節奏與沉著魅力展現多面表演力。"],
  ["02", "PHARITA", "2005.08.26", "泰國", "清亮音色與優雅台風，為歌曲帶來鮮明層次。"],
  ["03", "ASA", "2006.04.17", "日本", "節奏感鮮明，能在饒舌、舞蹈與創作表現間自在切換。"],
  ["04", "AHYEON", "2007.04.11", "韓國", "具爆發力的高音、饒舌與舞台掌控力，是全方位表演者。"],
  ["05", "RAMI", "2007.10.17", "韓國", "音色深厚且富情感，擅長用細膩層次推進歌曲氛圍。"],
  ["06", "RORA", "2008.08.14", "韓國", "溫暖而穩定的歌聲，兼具清新氣質與成熟表達。"],
  ["07", "CHIQUITA", "2009.02.17", "泰國", "充滿能量的舞台反應與辨識度，展現無畏的年輕魅力。"],
];

const fallbackPosts: Post[] = [
  { id: 1, nickname: "TaipeiMonstiez", body: "第一次聽到〈DRIP〉現場版的編曲，整個氣氛完全被拉滿！大家最期待下次巡演哪一站？", likes: 128, comments: 16, createdAt: "社群精選" },
  { id: 2, nickname: "AsaOnBeat", body: "推薦新粉從官方頻道的成員介紹與 LIVE PERFORMANCE 開始看，很快就能感受到七位成員各自的魅力。", likes: 92, comments: 8, createdAt: "新粉指南" },
];

export default function FanPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>(fallbackPosts);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(data => data?.user && setUser(data.user)).catch(() => {});
    fetch("/api/posts").then(r => r.ok ? r.json() : null).then(data => data?.posts?.length && setPosts(data.posts)).catch(() => {});
  }, []);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch(`/api/auth/${authMode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setFeedback(data.error || "目前無法完成，請稍後再試。");
    setUser(data.user); setFeedback("登入成功！");
    setTimeout(() => setAuthOpen(false), 500);
  }

  async function submitPost() {
    if (!user) { setAuthOpen(true); return; }
    if (message.trim().length < 2) return;
    const response = await fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: message }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { setPosts(p => [data.post, ...p]); setMessage(""); }
  }

  async function like(post: Post) {
    if (!user) { setAuthOpen(true); return; }
    const response = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setPosts(items => items.map(item => item.id === post.id ? { ...item, likes: data.likes, liked: data.liked } : item));
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }); setUser(null);
  }

  return <main className="shell">
    <nav className="nav"><div className="wrap nav-inner">
      <a href="#top" className="brand">BABY<b>MONSTER</b> / FANS</a>
      <div className="nav-links"><a href="#story">介紹</a><a href="#members">成員</a><a href="#listen">影音</a><a href="#events">活動</a><a href="#community">交流</a></div>
      <div className="nav-actions">{user ? <><button className="mini-button" onClick={() => document.querySelector("#community")?.scrollIntoView()}>Hi, {user.nickname}</button><button className="mini-button" onClick={logout}>登出</button></> : <button className="mini-button" onClick={() => setAuthOpen(true)}>粉絲登入 ↗</button>}</div>
    </div></nav>

    <section className="hero" id="top"><div className="hero-grid"/><div className="wrap hero-content">
      <div className="hero-kicker"><span>Unofficial fan community · Taiwan</span><span>Ruka · Pharita · Asa · Ahyeon · Rami · Rora · Chiquita</span></div>
      <h1 className="hero-title">Baby<span>Monster</span></h1>
      <div className="hero-bottom"><p className="hero-note">本網站為非官方、非營利粉絲交流站，與 YG Entertainment 或 BABYMONSTER 無隸屬關係。所有音樂與影片均由官方平台提供嵌入。</p><div className="hero-cta"><a className="primary" href="#listen">立即收聽官方音樂 ▶</a><a className="ghost" href="#community">加入 MONSTIEZ 交流</a></div></div>
    </div></section>
    <div className="ticker"><div className="ticker-track">SEVEN VOICES · ONE MONSTER ENERGY · MONSTIEZ TOGETHER · OFFICIAL LINKS ONLY · SEVEN VOICES · ONE MONSTER ENERGY · MONSTIEZ TOGETHER · OFFICIAL LINKS ONLY · </div></div>

    <section className="section" id="story"><div className="wrap">
      <p className="eyebrow">01 — Their story</p><h2 className="section-title">Born to be<br/>all-rounders.</h2>
      <div className="intro-grid"><div><div className="fact"><span>正式出道</span><strong>2024.04.01</strong></div><div className="fact"><span>所屬公司</span><strong>YG Entertainment</strong></div><div className="fact"><span>成員國籍</span><strong>韓國 · 泰國 · 日本</strong></div><div className="fact"><span>官方粉絲名</span><strong>MONSTIEZ</strong></div></div><div><div className="intro-copy">七位成員把 <em>vocal、rap、dance</em> 與強烈舞台能量凝聚成 BABYMONSTER。</div><p className="small-copy">BABYMONSTER 是 YG Entertainment 推出的七人女子團體，由 RUKA、PHARITA、ASA、AHYEON、RAMI、RORA、CHIQUITA 組成。團名結合舞台外的年輕魅力與舞台上的強大實力。她們於 2024 年以首張迷你專輯《BABYMONS7ER》正式出道，之後以《DRIP》等作品拓展全球活動。本站介紹以官方公開資料為準。</p></div></div>
    </div></section>

    <section className="section" id="members"><div className="wrap"><p className="eyebrow">02 — The seven</p><h2 className="section-title">Meet the<br/>monsters.</h2><p className="section-lead">以下生日與國籍依 BABYMONSTER 官方資料整理；官方未固定公布傳統「主唱／主舞／門面」等完整定位，因此本站不擅自貼標籤。</p>
      <div className="members-grid">{members.map((m) => <article className="member" key={m[1]}><span className="member-no">{m[0]}</span><span className="member-letter">{String(m[1])[0]}</span><div className="member-data"><b>{m[3]} · {m[2]}</b><h3>{m[1]}</h3><p>{m[4]}</p></div></article>)}</div>
      <div className="member-notes"><div className="note-card"><strong>VOCAL</strong>從細膩音色到爆發高音，歌曲以多樣聲線堆疊出戲劇張力。</div><div className="note-card"><strong>RAP</strong>以多語言與節奏變化呈現 YG 標誌性的嘻哈能量。</div><div className="note-card"><strong>PERFORMANCE</strong>七人隊形、精準舞蹈與充滿自信的舞台表情，是現場魅力核心。</div></div>
    </div></section>

    <section className="section" id="listen"><div className="wrap"><p className="eyebrow">03 — Official streams</p><h2 className="section-title">Press play.<br/>Stay official.</h2><p className="section-lead">直接使用 Spotify 與 YouTube 官方播放器，不重新上傳、不提供下載，也不複製完整歌詞。</p>
      <div className="listen-grid"><div className="embed-card"><iframe title="BABYMONSTER on Spotify" src="https://open.spotify.com/embed/artist/1SIocsqdEefUTE6XKGUiVS?utm_source=generator&theme=0" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"/></div><div className="social-stack"><div className="social-card"><div><strong>YouTube</strong><p>觀看 MV、舞台、舞蹈與幕後內容；播放量直接回到官方頻道。</p></div><a className="arrow-link" href="https://www.youtube.com/@BABYMONSTER" target="_blank" rel="noreferrer">前往官方頻道 ↗</a></div><div className="social-card"><div><strong>Instagram</strong><p>追蹤官方照片、Reels 與活動動態，不在本站重製貼文。</p></div><a className="arrow-link" href="https://www.instagram.com/babymonster_ygofficial/" target="_blank" rel="noreferrer">@babymonster_ygofficial ↗</a></div></div></div>
    </div></section>

    <section className="section" id="events"><div className="wrap"><p className="eyebrow">04 — Latest activities</p><h2 className="section-title">Where the<br/>energy lands.</h2><p className="section-lead">近期公開行程以官方日本站於 2026 年 7 月公布的「2026–27 BABYMONSTER WORLD TOUR [춤 (CHOOM)] IN JAPAN」資訊為基礎；票務、時間與成員出席請在出發前再次確認官方公告。</p>
      <div className="events"><article className="event"><div className="datebox"><b>28</b><span>JUL · 2026</span></div><div><h3>WORLD TOUR [춤 (CHOOM)]</h3><p>日本場次巡演資訊持續更新中</p></div><p>Marine Messe Fukuoka A Hall · Fukuoka</p><a className="pill" href="https://yg-babymonster-official.jp/" target="_blank" rel="noreferrer">官方確認 ↗</a></article><article className="event"><div className="datebox"><b>26</b><span>2026–27</span></div><div><h3>CHOOM IN JAPAN</h3><p>大阪、福岡等場次與售票公告</p></div><p>Japan · 詳細場館依官方站公告</p><a className="pill" href="https://yg-babymonster-official.jp/news/" target="_blank" rel="noreferrer">最新消息 ↗</a></article><article className="event"><div className="datebox"><b>NOW</b><span>ALWAYS ON</span></div><div><h3>OFFICIAL RELEASES</h3><p>新作品、表演影片與公告</p></div><p>Spotify · YouTube · Instagram</p><a className="pill" href="#listen">前往收聽</a></article></div>
    </div></section>

    <section className="section" id="community"><div className="wrap"><p className="eyebrow">05 — Fan community</p><h2 className="section-title">Your voice<br/>joins the crowd.</h2><div className="community-layout"><aside className="community-side"><h3>MONSTIEZ 留言板</h3><p>分享觀後感、應援靈感與新粉指南。請勿散播私生資訊、未證實消息、盜版連結、完整歌詞或未授權商業素材；尊重成員與其他粉絲。</p>{!user && <button className="primary" onClick={() => setAuthOpen(true)}>登入後參與交流</button>}</aside><div><div className="notice">社群守則：友善交流、不冒充官方、不公開個資、不提供盜版下載。留言內容由發文者負責，站方保留移除侵權或騷擾內容的權利。</div><div className="post-compose"><textarea aria-label="留言內容" value={message} onChange={e => setMessage(e.target.value)} placeholder={user ? `嗨 ${user.nickname}，想和 MONSTIEZ 分享什麼？` : "登入後即可發表留言…"} disabled={!user}/><div className="compose-footer"><span>{message.length}/500</span><button className="primary" onClick={submitPost}>發表留言 ↑</button></div></div>{posts.map(post => <article className="post" key={post.id}><div className="post-head"><div className="avatar">{post.nickname.slice(0,2).toUpperCase()}</div><div className="post-meta"><strong>{post.nickname}</strong><span>{post.createdAt}</span></div></div><p className="post-body">{post.body}</p><div className="post-actions"><button className={`action ${post.liked ? "active" : ""}`} onClick={() => like(post)}>♥ {post.likes}</button><button className="action">◌ {post.comments} 則回覆</button></div></article>)}</div></div></div></section>

    <footer className="footer"><div className="wrap"><div className="footer-top"><div className="footer-logo">MONSTIEZ.</div><div><a className="arrow-link" href="https://ygfamily.com/ko/artists/babymonster/profile" target="_blank" rel="noreferrer">YG 官方藝人頁 ↗</a></div></div><p>非官方粉絲站。BABYMONSTER、成員姓名、音樂、影像、標誌及相關商標權利歸各權利人所有。本站不販售官方素材，不主張任何商標所有權；嵌入內容由 Spotify、YouTube、Instagram 依其服務條款提供。活動資訊可能變動，請以主辦方最終公告為準。</p></div></footer>

    {authOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="粉絲登入"><div className="modal"><div className="modal-top"><h2>JOIN MONSTIEZ</h2><button className="close" aria-label="關閉" onClick={() => setAuthOpen(false)}>×</button></div><div className="tabs"><button className={authMode === "login" ? "active" : ""} onClick={() => {setAuthMode("login");setFeedback("")}}>登入</button><button className={authMode === "register" ? "active" : ""} onClick={() => {setAuthMode("register");setFeedback("")}}>電子郵件註冊</button></div><div className="oauth"><a href="/api/auth/oauth?provider=google">Google</a><a href="/api/auth/oauth?provider=wechat">WeChat</a><a href="/api/auth/oauth?provider=kakao">KakaoTalk</a></div><div className="divider">或使用電子郵件</div><form className="form" onSubmit={submitAuth}>{authMode === "register" && <label>粉絲暱稱<input name="nickname" required minLength={2} maxLength={24} autoComplete="nickname"/></label>}<label>電子郵件<input name="email" type="email" required autoComplete="email"/></label><label>密碼<input name="password" type="password" required minLength={10} autoComplete={authMode === "register" ? "new-password" : "current-password"}/></label><button className="primary" type="submit">{authMode === "register" ? "建立粉絲帳號" : "登入留言板"}</button></form>{feedback && <p className={feedback.includes("成功") ? "success" : "error"}>{feedback}</p>}<p className="small-copy">密碼至少 10 個字元，將以加鹽雜湊儲存。社群登入需由站長在部署平台設定各服務的 OAuth 金鑰後啟用。</p></div></div>}
  </main>;
}
