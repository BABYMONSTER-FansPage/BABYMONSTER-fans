export const supportedLocales = ["zh-TW", "zh-CN", "th", "en", "ko", "ja"] as const;
export type Locale = (typeof supportedLocales)[number];

export const localeLabels: Record<Locale, string> = {
  "zh-TW": "繁體中文", "zh-CN": "简体中文", th: "ไทย", en: "English", ko: "한국어", ja: "日本語",
};

export function normalizeLocale(value?: string | null): Locale | null {
  if (!value) return null;
  const clean = value.replace("_", "-").toLowerCase();
  if (clean === "zh-tw" || clean === "zh-hk" || clean === "zh-hant") return "zh-TW";
  if (clean.startsWith("zh")) return "zh-CN";
  if (clean.startsWith("th")) return "th";
  if (clean.startsWith("ko")) return "ko";
  if (clean.startsWith("ja")) return "ja";
  if (clean.startsWith("en")) return "en";
  return null;
}

export function getInitialLocale(browserLanguages: readonly string[] = [], stored?: string | null): Locale {
  const saved = normalizeLocale(stored);
  if (saved) return saved;
  for (const language of browserLanguages) {
    const matched = normalizeLocale(language);
    if (matched) return matched;
  }
  return "zh-TW";
}

type Copy = {
  nav: string[]; login: string; logout: string;
  heroKicker: string; heroNote: string; storyLabel: string; storyLead: string; storyBody: string;
  debut: string; agency: string; nationalities: string; fandom: string; membersLabel: string; membersLead: string;
  streamsLabel: string; streamsLead: string; youtubeCopy: string; instagramCopy: string; officialChannel: string; officialProfile: string;
  eventsLabel: string; eventsLead: string; verifyOfficial: string; latestNews: string;
  communityLabel: string; communityTitle: string; communityLead: string; signInToJoin: string; rules: string;
  composeGuest: string; composeUser: string; publish: string; replies: string; edit: string; remove: string; report: string; moderate: string;
  original: string; hideOriginal: string; translating: string; translationFallback: string;
  fanVoices: string; announcements: string; announcementFallbackTitle: string; announcementFallbackBody: string;
  loginTab: string; registerTab: string; nickname: string; email: string; password: string; createAccount: string; loginBoard: string; orEmail: string; close: string;
  authHelp: string; successLogin: string; genericError: string; roleAdmin: string; roleArtist: string;
  warning: string; sourceLink: string; language: string;
};

export const messages: Record<Locale, Copy> = {
  "zh-TW": {
    nav:["介紹","成員","影音","活動","交流"], login:"粉絲登入", logout:"登出",
    heroKicker:"全球非官方粉絲社群", heroNote:"七種聲音，一股無法忽視的 MONSTER ENERGY。一起認識作品、追蹤官方消息，和全球 MONSTIEZ 交流。",
    storyLabel:"01 — 她們的故事", storyLead:"七位成員把 vocal、rap、dance 與強烈舞台能量凝聚成 BABYMONSTER。", storyBody:"BABYMONSTER 是 YG Entertainment 推出的七人女子團體，由 RUKA、PHARITA、ASA、AHYEON、RAMI、RORA、CHIQUITA 組成。她們於 2024 年以《BABYMONS7ER》正式出道，持續以多元作品與現場演出拓展全球舞台。",
    debut:"正式出道", agency:"所屬公司", nationalities:"成員國籍", fandom:"官方粉絲名", membersLabel:"02 — 七位成員", membersLead:"向下捲動，跟著七位成員依序進入 BABYMONSTER 的舞台世界。",
    streamsLabel:"03 — 官方串流", streamsLead:"", youtubeCopy:"", instagramCopy:"追蹤官方照片、Reels 與活動動。", officialChannel:"前往官方頻道", officialProfile:"前往官方帳號",
    eventsLabel:"04 — 近期活動", eventsLead:"行程可能隨時變動；票務、時間與成員出席請在出發前再次確認官方公告。", verifyOfficial:"官方確認", latestNews:"最新消息",
    communityLabel:"05 — 粉絲交流", communityTitle:"MONSTIEZ 留言板", communityLead:"分享觀後感、應援靈感與新粉指南。拒絕私生資訊、未證實消息、盜版連結與騷擾。", signInToJoin:"登入後參與交流", rules:"社群守則：友善交流、不冒充官方、不公開個資、不提供盜版下載。留言可被檢舉，管理員可在後端審核。",
    composeGuest:"登入後即可發表留言…", composeUser:"想和全球 MONSTIEZ 分享什麼？", publish:"發表留言", replies:"則回覆", edit:"編輯", remove:"刪除", report:"檢舉", moderate:"審核",
    original:"查看原文", hideOriginal:"收合原文", translating:"翻譯中…", translationFallback:"翻譯暫時無法使用，已顯示原文。",
    fanVoices:"粉絲們的留言", announcements:"系統公告", announcementFallbackTitle:"網站功能測試中", announcementFallbackBody:"多語系、留言翻譯與身分權限已開放本機測試；正式服務設定完成前，部分第三方登入可能無法使用。",
    loginTab:"登入", registerTab:"電子郵件註冊", nickname:"粉絲暱稱", email:"電子郵件", password:"密碼", createAccount:"建立粉絲帳號", loginBoard:"登入留言板", orEmail:"或使用電子郵件", close:"關閉",
    authHelp:"密碼至少 10 個字元，將以加鹽雜湊儲存。社群登入需由站長設定各服務的 OAuth 金鑰。", successLogin:"登入成功！", genericError:"目前無法完成，請稍後再試。", roleAdmin:"管理員驗證帳號", roleArtist:"藝人驗證帳號",
    warning:"BABYMONSTER.fans 為非官方粉絲專頁。本站顯示的影像來自公開網路來源或第三方平台嵌入；如有侵權疑慮，請聯絡 support@babymonster.fans，我們將儘速處理。使用 Google 登入時，本站僅會使用你的暱稱、頭像及電子郵件地址。本站不主張擁有任何相關商標權。活動資訊可能隨時變動，請以官方最終公告為準。", sourceLink:"YG 官方藝人頁", language:"語言",
  },
  "zh-CN": {
    nav:["介绍","成员","影音","活动","交流"], login:"粉丝登录", logout:"退出",
    heroKicker:"全球非官方粉丝社区", heroNote:"七种声音，一股无法忽视的 MONSTER ENERGY。一起认识作品、追踪官方消息，与全球 MONSTIEZ 交流。", storyLabel:"01 — 她们的故事", storyLead:"七位成员把 vocal、rap、dance 与强烈舞台能量凝聚成 BABYMONSTER。", storyBody:"BABYMONSTER 是 YG Entertainment 推出的七人女子团体，由 RUKA、PHARITA、ASA、AHYEON、RAMI、RORA、CHIQUITA 组成。她们于 2024 年以《BABYMONS7ER》正式出道，持续以多元作品与现场演出拓展全球舞台。", debut:"正式出道", agency:"所属公司", nationalities:"成员国籍", fandom:"官方粉丝名", membersLabel:"02 — 七位成员", membersLead:"向下滚动，跟随七位成员依次进入 BABYMONSTER 的舞台世界。生日与国籍按官方公开资料整理。", streamsLabel:"03 — 官方串流", streamsLead:"直接使用官方播放器与账号链接，不重新上传、不提供下载或复制完整歌词。", youtubeCopy:"观看 MV、舞台、舞蹈与幕后内容；播放量回到官方频道。", instagramCopy:"追踪官方照片、Reels 与活动动态，不在本站重制贴文。", officialChannel:"前往官方频道", officialProfile:"前往官方账号", eventsLabel:"04 — 近期活动", eventsLead:"行程可能变动；票务、时间与成员出席请再次确认官方公告。", verifyOfficial:"官方确认", latestNews:"最新消息", communityLabel:"05 — 粉丝交流", communityTitle:"MONSTIEZ 留言板", communityLead:"分享观后感、应援灵感与新粉指南。拒绝私生信息、未经证实的消息、盗版链接与骚扰。", signInToJoin:"登录后参与交流", rules:"社区守则：友善交流、不冒充官方、不公开个人信息、不提供盗版下载。留言可被举报并由管理员审核。", composeGuest:"登录后即可留言…", composeUser:"想和全球 MONSTIEZ 分享什么？", publish:"发表留言", replies:"条回复", edit:"编辑", remove:"删除", report:"举报", moderate:"审核", original:"查看原文", hideOriginal:"收起原文", translating:"翻译中…", translationFallback:"翻译暂时不可用，已显示原文。", fanVoices:"粉丝们的留言", announcements:"系统公告", announcementFallbackTitle:"网站功能测试中", announcementFallbackBody:"多语言、留言翻译与身份权限已开放本地测试；正式服务设置完成前，部分第三方登录可能不可用。", loginTab:"登录", registerTab:"邮箱注册", nickname:"粉丝昵称", email:"电子邮件", password:"密码", createAccount:"创建粉丝账号", loginBoard:"登录留言板", orEmail:"或使用电子邮件", close:"关闭", authHelp:"密码至少 10 个字符，并以加盐哈希保存。第三方登录需由站长配置 OAuth 密钥。", successLogin:"登录成功！", genericError:"目前无法完成，请稍后再试。", roleAdmin:"管理员认证账号", roleArtist:"艺人认证账号", warning:"BABYMONSTER.fans 是非官方粉丝专页。本站显示的影像来自公开网络来源或第三方平台嵌入；如有侵权疑虑，请联系 support@babymonster.fans，我们将尽快处理。使用 Google 登录时，本站仅会使用你的昵称、头像及电子邮件地址。本站不主张拥有任何相关商标权。活动信息可能随时变动，请以官方最终公告为准。", sourceLink:"YG 官方艺人页", language:"语言",
  },
  th: {
    nav:["เรื่องราว","สมาชิก","สื่อ","กิจกรรม","ชุมชน"], login:"เข้าสู่ระบบแฟน", logout:"ออกจากระบบ", heroKicker:"ชุมชนแฟนคลับทั่วโลกอย่างไม่เป็นทางการ", heroNote:"เจ็ดเสียง พลัง MONSTER หนึ่งเดียว ติดตามผลงาน ข่าวทางการ และพูดคุยกับ MONSTIEZ ทั่วโลก", storyLabel:"01 — เรื่องราว", storyLead:"สมาชิกทั้งเจ็ดผสานเสียงร้อง แร็ป การเต้น และพลังบนเวทีเป็น BABYMONSTER", storyBody:"BABYMONSTER คือเกิร์ลกรุ๊ป 7 คนจาก YG Entertainment: RUKA, PHARITA, ASA, AHYEON, RAMI, RORA และ CHIQUITA เดบิวต์อย่างเป็นทางการในปี 2024 ด้วย BABYMONS7ER", debut:"เดบิวต์", agency:"ต้นสังกัด", nationalities:"สัญชาติ", fandom:"ชื่อแฟนคลับ", membersLabel:"02 — สมาชิกทั้งเจ็ด", membersLead:"เลื่อนลงเพื่อพบสมาชิกแต่ละคน ข้อมูลวันเกิดและสัญชาติมาจากแหล่งทางการ", streamsLabel:"03 — สตรีมทางการ", streamsLead:"ใช้เครื่องเล่นและลิงก์ทางการเท่านั้น ไม่มีการอัปโหลดซ้ำ ดาวน์โหลด หรือคัดลอกเนื้อเพลงเต็ม", youtubeCopy:"ชม MV เวที การเต้น และเบื้องหลังบนช่องทางการ", instagramCopy:"ติดตามภาพ Reels และข่าวกิจกรรมจากบัญชีทางการ", officialChannel:"ไปที่ช่องทางการ", officialProfile:"ไปที่บัญชีทางการ", eventsLabel:"04 — กิจกรรมล่าสุด", eventsLead:"กำหนดการอาจเปลี่ยนแปลง โปรดตรวจสอบประกาศทางการก่อนเดินทาง", verifyOfficial:"ตรวจสอบทางการ", latestNews:"ข่าวล่าสุด", communityLabel:"05 — ชุมชนแฟน", communityTitle:"กระดาน MONSTIEZ", communityLead:"แบ่งปันความประทับใจ ไอเดียสนับสนุน และคำแนะนำสำหรับแฟนใหม่ ห้ามข้อมูลส่วนตัว ข่าวลือ ลิงก์ละเมิดลิขสิทธิ์ และการคุกคาม", signInToJoin:"เข้าสู่ระบบเพื่อร่วมพูดคุย", rules:"กติกา: เป็นมิตร ไม่แอบอ้างเป็นทางการ ไม่เปิดเผยข้อมูลส่วนตัว และไม่แชร์การดาวน์โหลดละเมิดลิขสิทธิ์", composeGuest:"เข้าสู่ระบบเพื่อโพสต์…", composeUser:"อยากแบ่งปันอะไรกับ MONSTIEZ ทั่วโลก?", publish:"โพสต์", replies:"คำตอบ", edit:"แก้ไข", remove:"ลบ", report:"รายงาน", moderate:"ตรวจสอบ", original:"ดูต้นฉบับ", hideOriginal:"ซ่อนต้นฉบับ", translating:"กำลังแปล…", translationFallback:"การแปลไม่พร้อมใช้งาน แสดงข้อความต้นฉบับแล้ว", fanVoices:"ข้อความจากแฟนๆ", announcements:"ประกาศระบบ", announcementFallbackTitle:"กำลังทดสอบเว็บไซต์", announcementFallbackBody:"เปิดทดสอบหลายภาษา การแปลความคิดเห็น และสิทธิ์ผู้ใช้ในเครื่องแล้ว บางการเข้าสู่ระบบอาจยังไม่พร้อม", loginTab:"เข้าสู่ระบบ", registerTab:"สมัครด้วยอีเมล", nickname:"ชื่อแฟน", email:"อีเมล", password:"รหัสผ่าน", createAccount:"สร้างบัญชี", loginBoard:"เข้าสู่กระดาน", orEmail:"หรือใช้อีเมล", close:"ปิด", authHelp:"รหัสผ่านอย่างน้อย 10 ตัวอักษรและจัดเก็บแบบแฮช การเข้าสู่ระบบภายนอกต้องตั้งค่า OAuth", successLogin:"เข้าสู่ระบบสำเร็จ!", genericError:"ดำเนินการไม่ได้ โปรดลองอีกครั้ง", roleAdmin:"บัญชีผู้ดูแลที่ยืนยันแล้ว", roleArtist:"บัญชีศิลปินที่ยืนยันแล้ว", warning:"BABYMONSTER.fans เป็นเพจแฟนคลับอย่างไม่เป็นทางการ ภาพที่แสดงบนเว็บไซต์มาจากแหล่งข้อมูลสาธารณะบนอินเทอร์เน็ตหรือการฝังเนื้อหาจากแพลตฟอร์มภายนอก หากมีข้อกังวลเกี่ยวกับการละเมิดสิทธิ์ โปรดติดต่อ support@babymonster.fans แล้วเราจะดำเนินการโดยเร็ว เมื่อใช้การเข้าสู่ระบบด้วย Google เว็บไซต์จะใช้เฉพาะชื่อที่แสดง รูปโปรไฟล์ และที่อยู่อีเมลของคุณ เว็บไซต์ไม่อ้างสิทธิ์ในเครื่องหมายการค้าใด ๆ ข้อมูลกิจกรรมอาจเปลี่ยนแปลงได้ โปรดยึดประกาศอย่างเป็นทางการล่าสุดเป็นหลัก", sourceLink:"หน้า YG ทางการ", language:"ภาษา",
  },
  en: {
    nav:["Story","Members","Media","Events","Community"], login:"Fan sign in", logout:"Sign out", heroKicker:"Unofficial global fan community", heroNote:"Seven voices. One monster energy. Discover the music, follow official updates, and connect with MONSTIEZ worldwide.", storyLabel:"01 — Their story", storyLead:"Seven members fuse vocal, rap, dance and fearless stage energy into BABYMONSTER.", storyBody:"BABYMONSTER is a seven-member girl group from YG Entertainment: RUKA, PHARITA, ASA, AHYEON, RAMI, RORA and CHIQUITA. They officially debuted with BABYMONS7ER in 2024 and continue expanding their global stage through new releases and live performance.", debut:"Official debut", agency:"Agency", nationalities:"Nationalities", fandom:"Official fandom", membersLabel:"02 — The seven", membersLead:"Scroll to meet each member in sequence. Birth dates and nationalities follow official public profiles; this site does not invent fixed positions.", streamsLabel:"03 — Official streams", streamsLead:"Official players and account links only—no reuploads, downloads, or reproduced full lyrics.", youtubeCopy:"Watch music videos, stages, dance performances and behind-the-scenes content on the official channel.", instagramCopy:"Follow official photos, Reels and event updates without reposting them here.", officialChannel:"Official channel", officialProfile:"Official profile", eventsLabel:"04 — Latest activities", eventsLead:"Schedules can change. Recheck official announcements for tickets, times and member attendance before traveling.", verifyOfficial:"Verify officially", latestNews:"Latest news", communityLabel:"05 — Fan community", communityTitle:"MONSTIEZ board", communityLead:"Share reactions, support ideas and new-fan guides. No private tracking, unverified claims, piracy or harassment.", signInToJoin:"Sign in to join", rules:"Community rules: be kind, never impersonate official accounts, protect personal data, and never share pirated downloads. Posts can be reported and moderated.", composeGuest:"Sign in to post…", composeUser:"What would you like to share with MONSTIEZ worldwide?", publish:"Publish", replies:"replies", edit:"Edit", remove:"Delete", report:"Report", moderate:"Moderate", original:"View original", hideOriginal:"Hide original", translating:"Translating…", translationFallback:"Translation is unavailable; the original is shown.", fanVoices:"Voices from the fans", announcements:"System announcements", announcementFallbackTitle:"Local feature testing", announcementFallbackBody:"Languages, comment translation and role permissions are ready for local testing. Some social sign-ins remain unavailable until service settings are supplied.", loginTab:"Sign in", registerTab:"Register with email", nickname:"Fan nickname", email:"Email", password:"Password", createAccount:"Create fan account", loginBoard:"Sign in to board", orEmail:"or use email", close:"Close", authHelp:"Passwords must be at least 10 characters and are stored as salted hashes. Social sign-in requires server-side OAuth credentials.", successLogin:"Signed in!", genericError:"Unable to complete that action. Try again later.", roleAdmin:"Verified administrator", roleArtist:"Verified artist", warning:"BABYMONSTER.fans is an unofficial fan page. Images displayed on this site come from publicly available online sources or third-party platform embeds. If you have any copyright concerns, please contact support@babymonster.fans and we will respond promptly. When you sign in with Google, this site uses only your display name, profile photo, and email address. This site does not claim ownership of any trademarks. Event information is subject to change; please refer to the latest official announcements.", sourceLink:"Official YG artist page", language:"Language",
  },
  ko: {
    nav:["소개","멤버","미디어","일정","커뮤니티"], login:"팬 로그인", logout:"로그아웃", heroKicker:"비공식 글로벌 팬 커뮤니티", heroNote:"일곱 목소리, 하나의 MONSTER ENERGY. 음악과 공식 소식을 만나고 전 세계 MONSTIEZ와 소통하세요.", storyLabel:"01 — 이야기", storyLead:"일곱 멤버의 보컬, 랩, 댄스와 무대 에너지가 BABYMONSTER를 완성합니다.", storyBody:"BABYMONSTER는 YG Entertainment의 7인조 걸그룹으로 RUKA, PHARITA, ASA, AHYEON, RAMI, RORA, CHIQUITA로 구성됩니다. 2024년 BABYMONS7ER로 공식 데뷔했습니다.", debut:"공식 데뷔", agency:"소속사", nationalities:"국적", fandom:"공식 팬덤", membersLabel:"02 — 일곱 멤버", membersLead:"스크롤하며 각 멤버를 만나보세요. 생일과 국적은 공식 프로필을 따릅니다.", streamsLabel:"03 — 공식 스트리밍", streamsLead:"공식 플레이어와 계정 링크만 사용하며 재업로드, 다운로드, 전체 가사 복사를 제공하지 않습니다.", youtubeCopy:"공식 채널에서 MV, 무대, 댄스와 비하인드를 감상하세요.", instagramCopy:"공식 사진, Reels와 일정 소식을 확인하세요.", officialChannel:"공식 채널", officialProfile:"공식 계정", eventsLabel:"04 — 최근 일정", eventsLead:"일정은 변경될 수 있습니다. 출발 전 공식 공지를 다시 확인해 주세요.", verifyOfficial:"공식 확인", latestNews:"최신 소식", communityLabel:"05 — 팬 커뮤니티", communityTitle:"MONSTIEZ 게시판", communityLead:"후기, 응원 아이디어와 입문 가이드를 나눠요. 사생활 추적, 미확인 정보, 불법 링크와 괴롭힘은 금지합니다.", signInToJoin:"로그인 후 참여", rules:"커뮤니티 규칙: 서로 존중하고 공식 계정을 사칭하지 않으며 개인정보와 저작권을 보호합니다.", composeGuest:"로그인 후 글을 남길 수 있어요…", composeUser:"전 세계 MONSTIEZ와 무엇을 나누고 싶나요?", publish:"게시", replies:"답글", edit:"수정", remove:"삭제", report:"신고", moderate:"검토", original:"원문 보기", hideOriginal:"원문 닫기", translating:"번역 중…", translationFallback:"번역을 사용할 수 없어 원문을 표시합니다.", fanVoices:"팬들의 메시지", announcements:"시스템 공지", announcementFallbackTitle:"로컬 기능 테스트 중", announcementFallbackBody:"다국어, 댓글 번역과 권한 기능을 로컬에서 테스트할 수 있습니다. 일부 소셜 로그인은 설정 전까지 사용할 수 없습니다.", loginTab:"로그인", registerTab:"이메일 가입", nickname:"팬 닉네임", email:"이메일", password:"비밀번호", createAccount:"계정 만들기", loginBoard:"게시판 로그인", orEmail:"또는 이메일 사용", close:"닫기", authHelp:"비밀번호는 10자 이상이며 솔트 해시로 저장됩니다. 소셜 로그인에는 서버 OAuth 설정이 필요합니다.", successLogin:"로그인되었습니다!", genericError:"처리할 수 없습니다. 잠시 후 다시 시도해 주세요.", roleAdmin:"인증된 관리자", roleArtist:"인증된 아티스트", warning:"BABYMONSTER.fans는 비공식 팬 페이지입니다. 사이트에 표시되는 이미지는 공개된 온라인 출처 또는 제3자 플랫폼 임베드를 통해 제공됩니다. 저작권 침해가 우려되는 경우 support@babymonster.fans로 연락해 주시면 신속히 처리하겠습니다. Google 로그인 시에는 표시 이름, 프로필 사진 및 이메일 주소만 사용합니다. 본 사이트는 어떠한 상표권도 주장하지 않습니다. 이벤트 정보는 변경될 수 있으므로 최신 공식 공지를 확인해 주세요.", sourceLink:"YG 공식 아티스트 페이지", language:"언어",
  },
  ja: {
    nav:["紹介","メンバー","メディア","イベント","交流"], login:"ファンログイン", logout:"ログアウト", heroKicker:"非公式グローバルファンコミュニティ", heroNote:"7つの声、ひとつのMONSTER ENERGY。音楽と公式ニュースを楽しみ、世界のMONSTIEZと交流しよう。", storyLabel:"01 — ストーリー", storyLead:"7人のボーカル、ラップ、ダンスとステージエネルギーがBABYMONSTERを形作ります。", storyBody:"BABYMONSTERはYG Entertainmentの7人組ガールズグループ。RUKA、PHARITA、ASA、AHYEON、RAMI、RORA、CHIQUITAで構成され、2024年にBABYMONS7ERで正式デビューしました。", debut:"正式デビュー", agency:"所属", nationalities:"国籍", fandom:"公式ファンダム", membersLabel:"02 — 7人のメンバー", membersLead:"スクロールしてメンバーを順番に紹介。生年月日と国籍は公式プロフィールに基づきます。", streamsLabel:"03 — 公式ストリーミング", streamsLead:"公式プレイヤーとアカウントへのリンクのみ。再アップロード、ダウンロード、歌詞全文の転載は行いません。", youtubeCopy:"公式チャンネルでMV、ステージ、ダンス、舞台裏を視聴できます。", instagramCopy:"公式の写真、Reels、イベント情報をフォローできます。", officialChannel:"公式チャンネル", officialProfile:"公式アカウント", eventsLabel:"04 — 最新イベント", eventsLead:"予定は変更される場合があります。チケット、時間、出演は公式発表を再確認してください。", verifyOfficial:"公式で確認", latestNews:"最新情報", communityLabel:"05 — ファン交流", communityTitle:"MONSTIEZ掲示板", communityLead:"感想、応援アイデア、新規ファン向けガイドを共有。私生活の追跡、未確認情報、海賊版、嫌がらせは禁止です。", signInToJoin:"ログインして参加", rules:"ルール：互いを尊重し、公式になりすまさず、個人情報と著作権を守りましょう。投稿は通報・審査できます。", composeGuest:"ログイン後に投稿できます…", composeUser:"世界のMONSTIEZと何を共有しますか？", publish:"投稿", replies:"件の返信", edit:"編集", remove:"削除", report:"通報", moderate:"審査", original:"原文を見る", hideOriginal:"原文を閉じる", translating:"翻訳中…", translationFallback:"翻訳できないため原文を表示しています。", fanVoices:"ファンのメッセージ", announcements:"システムのお知らせ", announcementFallbackTitle:"ローカル機能をテスト中", announcementFallbackBody:"多言語、コメント翻訳、権限機能をローカルでテストできます。一部のソーシャルログインは設定完了まで利用できません。", loginTab:"ログイン", registerTab:"メールで登録", nickname:"ファンニックネーム", email:"メール", password:"パスワード", createAccount:"アカウント作成", loginBoard:"掲示板にログイン", orEmail:"またはメールを使用", close:"閉じる", authHelp:"パスワードは10文字以上でソルト付きハッシュとして保存されます。ソーシャルログインにはOAuth設定が必要です。", successLogin:"ログインしました！", genericError:"処理できませんでした。後でもう一度お試しください。", roleAdmin:"認証済み管理者", roleArtist:"認証済みアーティスト", warning:"BABYMONSTER.fansは非公式ファンページです。本サイトに表示される画像は、公開されているオンライン情報源または第三者プラットフォームの埋め込みから提供されています。権利侵害のおそれがある場合は、support@babymonster.fansまでご連絡ください。速やかに対応します。Googleログインでは、表示名、プロフィール画像、メールアドレスのみを使用します。本サイトはいかなる商標権も主張しません。イベント情報は変更される場合がありますので、最新の公式発表をご確認ください。", sourceLink:"YG公式アーティストページ", language:"言語",
  },
};

type FixedCopy = {
  officialAppNameLabel: string;
  fanCommunityPlatform: string;
  appPurpose: string;
  privacyPolicy: string;
  termsOfService: string;
  spotifyImage: string;
  trackListMissing: string;
  showAllSongs: string;
  spotifyUnavailableTitle: string;
  spotifyUnavailableHelp: string;
  openSpotifyDiscography: string;
  detailIntro: string;
  instagramFeedKicker: string;
  instagramFeedTitle: string;
  instagramFeedBody: string;
  openInstagramPost: string;
  viewAllPosts: string;
  allPostsAria: string;
  emptyPosts: string;
  loadingSignal: string;
  loadingStatus: string;
  nicknameTitle: string;
  nicknameHelp: string;
  saveNickname: string;
  authPurpose: string;
  editMode: string;
  save: string;
  addText: string;
  addImage: string;
  addSection: string;
  activityManager: string;
};

export const fixedMessages: Record<Locale, FixedCopy> = {
  "zh-TW": {
    officialAppNameLabel: "What is Monstiez?",
    fanCommunityPlatform: "BABYMONSTER fan community platform",
    appPurpose: "MONSTIEZ 是 BABYMONSTER 的官方粉絲名。Monstiez 是提供 BABYMONSTER 粉絲交流、留言與內容瀏覽的粉絲社群平台。使用者登入後可以參與社群互動、管理個人資料，並瀏覽官方社群連結、成員介紹與近期活動整理。",
    privacyPolicy: "隱私權政策",
    termsOfService: "服務條款",
    spotifyImage: "Spotify 圖片",
    trackListMissing: "曲目資料尚未提供，可從 Spotify 匯入或在後台手動新增歌曲名稱。",
    showAllSongs: "顯示全部歌曲",
    spotifyUnavailableTitle: "Spotify 專輯資料暫時沒有載入。",
    spotifyUnavailableHelp: "如果你是管理員，請確認 spotify-releases Edge Function 已重新部署，或先在齒輪後台手動新增專輯／單曲。",
    openSpotifyDiscography: "開啟 Spotify 作品頁",
    detailIntro: "詳細介紹",
    instagramFeedKicker: "官方 YG Signal",
    instagramFeedTitle: "Instagram Dispatch",
    instagramFeedBody: "只嵌入官方 Instagram 貼文，不下載、不重新上傳、不儲存圖片檔；內容由 Instagram 依其服務條款提供。",
    openInstagramPost: "在 Instagram 開啟",
    viewAllPosts: "查看全部留言",
    allPostsAria: "全部 MONSTIEZ 留言",
    emptyPosts: "目前還沒有留言。",
    loadingSignal: "MONSTIEZ SIGNAL",
    loadingStatus: "Loading official links · fan voices · stage data",
    nicknameTitle: "MONSTIEZ NAME",
    nicknameHelp: "社群登入完成後，請設定公開顯示的粉絲暱稱。這會顯示在留言板上。",
    saveNickname: "儲存暱稱",
    authPurpose: "Monstiez 是 BABYMONSTER 粉絲交流、留言與內容瀏覽平台。",
    editMode: "編輯模式",
    save: "儲存",
    addText: "新增文字",
    addImage: "新增圖片",
    addSection: "新增板塊",
    activityManager: "活動管理",
  },
  "zh-CN": {
    officialAppNameLabel: "什么是 Monstiez？",
    fanCommunityPlatform: "BABYMONSTER fan community platform",
    appPurpose: "MONSTIEZ 是 BABYMONSTER 的官方粉丝名。Monstiez 是提供 BABYMONSTER 粉丝交流、留言与内容浏览的粉丝社区平台。用户登录后可以参与社区互动、管理个人资料，并浏览官方社交链接、成员介绍与近期活动整理。",
    privacyPolicy: "隐私权政策",
    termsOfService: "服务条款",
    spotifyImage: "Spotify 图片",
    trackListMissing: "曲目资料尚未提供，可从 Spotify 导入或在后台手动新增歌曲名称。",
    showAllSongs: "显示全部歌曲",
    spotifyUnavailableTitle: "Spotify 专辑资料暂时没有载入。",
    spotifyUnavailableHelp: "如果你是管理员，请确认 spotify-releases Edge Function 已重新部署，或先在齿轮后台手动新增专辑／单曲。",
    openSpotifyDiscography: "打开 Spotify 作品页",
    detailIntro: "详细介绍",
    instagramFeedKicker: "官方 YG Signal",
    instagramFeedTitle: "Instagram Dispatch",
    instagramFeedBody: "只嵌入官方 Instagram 帖文，不下载、不重新上传、不储存图片文件；内容由 Instagram 按其服务条款提供。",
    openInstagramPost: "在 Instagram 打开",
    viewAllPosts: "查看全部留言",
    allPostsAria: "全部 MONSTIEZ 留言",
    emptyPosts: "目前还没有留言。",
    loadingSignal: "MONSTIEZ SIGNAL",
    loadingStatus: "Loading official links · fan voices · stage data",
    nicknameTitle: "MONSTIEZ NAME",
    nicknameHelp: "社交登录完成后，请设置公开显示的粉丝昵称。它会显示在留言板上。",
    saveNickname: "保存昵称",
    authPurpose: "Monstiez 是 BABYMONSTER 粉丝交流、留言与内容浏览平台。",
    editMode: "编辑模式",
    save: "保存",
    addText: "新增文字",
    addImage: "新增图片",
    addSection: "新增板块",
    activityManager: "活动管理",
  },
  th: {
    officialAppNameLabel: "Monstiez คืออะไร?",
    fanCommunityPlatform: "แพลตฟอร์มชุมชนแฟน BABYMONSTER",
    appPurpose: "MONSTIEZ คือชื่อแฟนคลับอย่างเป็นทางการของ BABYMONSTER ส่วน Monstiez เป็นแพลตฟอร์มชุมชนสำหรับแฟน ๆ เพื่อพูดคุย แสดงความคิดเห็น และเรียกดูคอนเทนต์เกี่ยวกับ BABYMONSTER หลังจากเข้าสู่ระบบ ผู้ใช้สามารถร่วมกิจกรรมในชุมชน จัดการโปรไฟล์ และดูรวมลิงก์โซเชียลทางการ แนะนำสมาชิก และกิจกรรมล่าสุด",
    privacyPolicy: "นโยบายความเป็นส่วนตัว",
    termsOfService: "เงื่อนไขการใช้บริการ",
    spotifyImage: "รูปภาพ Spotify",
    trackListMissing: "ยังไม่มีข้อมูลรายชื่อเพลง สามารถนำเข้าจาก Spotify หรือเพิ่มชื่อเพลงเองในหลังบ้าน",
    showAllSongs: "แสดงเพลงทั้งหมด",
    spotifyUnavailableTitle: "ยังโหลดข้อมูลอัลบั้มจาก Spotify ไม่ได้ในขณะนี้",
    spotifyUnavailableHelp: "หากคุณเป็นผู้ดูแล โปรดตรวจสอบว่าได้ deploy Edge Function spotify-releases ใหม่แล้ว หรือเพิ่มอัลบั้ม/ซิงเกิลด้วยตนเองในหลังบ้านก่อน",
    openSpotifyDiscography: "เปิดผลงานใน Spotify",
    detailIntro: "รายละเอียด",
    instagramFeedKicker: "สัญญาณ YG ทางการ",
    instagramFeedTitle: "Instagram Dispatch",
    instagramFeedBody: "ฝังเฉพาะโพสต์ Instagram ทางการเท่านั้น ไม่มีการดาวน์โหลด อัปโหลดซ้ำ หรือจัดเก็บไฟล์รูปภาพ เนื้อหาจัดส่งโดย Instagram ตามเงื่อนไขของแพลตฟอร์ม",
    openInstagramPost: "เปิดใน Instagram",
    viewAllPosts: "ดูข้อความทั้งหมด",
    allPostsAria: "ข้อความ MONSTIEZ ทั้งหมด",
    emptyPosts: "ยังไม่มีข้อความ",
    loadingSignal: "MONSTIEZ SIGNAL",
    loadingStatus: "กำลังโหลดลิงก์ทางการ · เสียงแฟน ๆ · ข้อมูลเวที",
    nicknameTitle: "ชื่อ MONSTIEZ",
    nicknameHelp: "หลังจากเข้าสู่ระบบด้วยโซเชียลแล้ว โปรดตั้งชื่อแฟนที่จะแสดงแบบสาธารณะ ชื่อนี้จะแสดงบนกระดานข้อความ",
    saveNickname: "บันทึกชื่อ",
    authPurpose: "Monstiez เป็นแพลตฟอร์มสำหรับแฟน BABYMONSTER ในการพูดคุย แสดงความคิดเห็น และดูคอนเทนต์",
    editMode: "โหมดแก้ไข",
    save: "บันทึก",
    addText: "เพิ่มข้อความ",
    addImage: "เพิ่มรูปภาพ",
    addSection: "เพิ่มส่วน",
    activityManager: "จัดการกิจกรรม",
  },
  en: {
    officialAppNameLabel: "What is Monstiez?",
    fanCommunityPlatform: "BABYMONSTER fan community platform",
    appPurpose: "MONSTIEZ is the official fandom name for BABYMONSTER. Monstiez is a fan community platform for BABYMONSTER discussions, comments, and content browsing. After signing in, users can join community interactions, manage their profiles, and browse official social links, member introductions, and recent activity summaries.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    spotifyImage: "Spotify image",
    trackListMissing: "Track details are not available yet. Import from Spotify or add song names manually in the admin panel.",
    showAllSongs: "Show all songs",
    spotifyUnavailableTitle: "Spotify album data is temporarily unavailable.",
    spotifyUnavailableHelp: "If you are an administrator, confirm that the spotify-releases Edge Function has been redeployed, or manually add albums/singles in the admin panel first.",
    openSpotifyDiscography: "Open Spotify discography",
    detailIntro: "Detailed intro",
    instagramFeedKicker: "Official YG Signal",
    instagramFeedTitle: "Instagram Dispatch",
    instagramFeedBody: "Official Instagram posts are embedded only. This site does not download, reupload, or store image files; the content is provided by Instagram under its own terms.",
    openInstagramPost: "Open on Instagram",
    viewAllPosts: "View all posts",
    allPostsAria: "All MONSTIEZ posts",
    emptyPosts: "There are no posts yet.",
    loadingSignal: "MONSTIEZ SIGNAL",
    loadingStatus: "Loading official links · fan voices · stage data",
    nicknameTitle: "MONSTIEZ NAME",
    nicknameHelp: "After social sign-in, set the public fan nickname that will appear on the message board.",
    saveNickname: "Save nickname",
    authPurpose: "Monstiez is a BABYMONSTER fan platform for discussion, comments, and content browsing.",
    editMode: "Edit mode",
    save: "Save",
    addText: "Add text",
    addImage: "Add image",
    addSection: "Add section",
    activityManager: "Activity manager",
  },
  ko: {
    officialAppNameLabel: "Monstiez란?",
    fanCommunityPlatform: "BABYMONSTER 팬 커뮤니티 플랫폼",
    appPurpose: "MONSTIEZ는 BABYMONSTER의 공식 팬덤명입니다. Monstiez는 BABYMONSTER 팬들이 교류하고 댓글을 남기며 콘텐츠를 둘러볼 수 있는 팬 커뮤니티 플랫폼입니다. 사용자는 로그인 후 커뮤니티 활동에 참여하고 프로필을 관리하며 공식 소셜 링크, 멤버 소개와 최근 활동 정리를 볼 수 있습니다.",
    privacyPolicy: "개인정보 처리방침",
    termsOfService: "서비스 약관",
    spotifyImage: "Spotify 이미지",
    trackListMissing: "트랙 정보가 아직 없습니다. Spotify에서 가져오거나 관리자 패널에서 곡명을 직접 추가할 수 있습니다.",
    showAllSongs: "전체 곡 보기",
    spotifyUnavailableTitle: "Spotify 앨범 데이터를 일시적으로 불러오지 못했습니다.",
    spotifyUnavailableHelp: "관리자라면 spotify-releases Edge Function을 다시 배포했는지 확인하거나 관리자 패널에서 앨범/싱글을 직접 추가해 주세요.",
    openSpotifyDiscography: "Spotify 디스코그래피 열기",
    detailIntro: "자세히 보기",
    instagramFeedKicker: "공식 YG Signal",
    instagramFeedTitle: "Instagram Dispatch",
    instagramFeedBody: "공식 Instagram 게시물만 임베드하며 이미지 파일을 다운로드, 재업로드 또는 저장하지 않습니다. 콘텐츠는 Instagram 약관에 따라 제공됩니다.",
    openInstagramPost: "Instagram에서 열기",
    viewAllPosts: "전체 댓글 보기",
    allPostsAria: "전체 MONSTIEZ 댓글",
    emptyPosts: "아직 댓글이 없습니다.",
    loadingSignal: "MONSTIEZ SIGNAL",
    loadingStatus: "공식 링크 · 팬 메시지 · 무대 데이터 로딩 중",
    nicknameTitle: "MONSTIEZ NAME",
    nicknameHelp: "소셜 로그인 후 게시판에 공개로 표시될 팬 닉네임을 설정해 주세요.",
    saveNickname: "닉네임 저장",
    authPurpose: "Monstiez는 BABYMONSTER 팬 교류, 댓글과 콘텐츠 탐색을 위한 플랫폼입니다.",
    editMode: "편집 모드",
    save: "저장",
    addText: "텍스트 추가",
    addImage: "이미지 추가",
    addSection: "섹션 추가",
    activityManager: "활동 관리",
  },
  ja: {
    officialAppNameLabel: "Monstiezとは？",
    fanCommunityPlatform: "BABYMONSTERファンコミュニティプラットフォーム",
    appPurpose: "MONSTIEZはBABYMONSTERの公式ファンダム名です。Monstiezは、BABYMONSTERファンの交流、コメント投稿、コンテンツ閲覧のためのファンコミュニティプラットフォームです。ユーザーはログイン後、コミュニティで交流し、プロフィールを管理し、公式SNSリンク、メンバー紹介、最近の活動まとめを閲覧できます。",
    privacyPolicy: "プライバシーポリシー",
    termsOfService: "利用規約",
    spotifyImage: "Spotify画像",
    trackListMissing: "曲目情報はまだありません。Spotifyから取り込むか、管理画面で曲名を手動追加できます。",
    showAllSongs: "すべての曲を表示",
    spotifyUnavailableTitle: "Spotifyのアルバム情報を一時的に読み込めません。",
    spotifyUnavailableHelp: "管理者の場合は、spotify-releases Edge Functionを再デプロイしたか確認するか、管理画面でアルバム／シングルを手動追加してください。",
    openSpotifyDiscography: "Spotifyディスコグラフィーを開く",
    detailIntro: "詳しい紹介",
    instagramFeedKicker: "公式YG Signal",
    instagramFeedTitle: "Instagram Dispatch",
    instagramFeedBody: "公式Instagram投稿のみを埋め込みます。画像ファイルのダウンロード、再アップロード、保存は行わず、コンテンツはInstagramの規約に基づいて提供されます。",
    openInstagramPost: "Instagramで開く",
    viewAllPosts: "すべての投稿を見る",
    allPostsAria: "すべてのMONSTIEZ投稿",
    emptyPosts: "まだ投稿はありません。",
    loadingSignal: "MONSTIEZ SIGNAL",
    loadingStatus: "公式リンク · ファンの声 · ステージデータを読み込み中",
    nicknameTitle: "MONSTIEZ NAME",
    nicknameHelp: "ソーシャルログイン後、掲示板に公開表示されるファンニックネームを設定してください。",
    saveNickname: "ニックネームを保存",
    authPurpose: "Monstiezは、BABYMONSTERファンの交流、コメント、コンテンツ閲覧のためのプラットフォームです。",
    editMode: "編集モード",
    save: "保存",
    addText: "テキストを追加",
    addImage: "画像を追加",
    addSection: "セクションを追加",
    activityManager: "活動管理",
  },
};

/** Curated static member copy. Site chrome/content is bundled; only fan posts use machine translation. */
export const memberBios: Record<Locale, string[]> = {
  "zh-TW": [
    "以沉著俐落的節奏感、穩定舞台表現與強烈舞蹈線條展現魅力。",
    "清澈音色與優雅舞台氣質，讓歌曲多了一層細緻而明亮的色彩。",
    "自然穿梭於 rap、dance 與創作表達，以鮮明節奏塑造舞台張力。",
    "兼具高音、rap 與舞台掌控力，是能在不同段落切換能量的全方位表演者。",
    "富有情感與厚度的聲音，擅長把歌曲的情緒推向更深的位置。",
    "溫暖而穩定的歌聲，在清新感與成熟表達之間取得平衡。",
    "爆發力十足的舞台能量、明亮音色與大膽自信，帶來鮮明記憶點。",
  ],
  "zh-CN": [
    "以沉着利落的节奏感、稳定舞台表现与有力舞蹈线条展现魅力。",
    "清澈音色与优雅舞台气质，为歌曲增添细致而明亮的色彩。",
    "自然穿梭于 rap、dance 与创作表达，以鲜明节奏塑造舞台张力。",
    "兼具高音、rap 与舞台掌控力，能在不同段落自由切换能量。",
    "富有情感与厚度的声音，善于把歌曲情绪带向更深的位置。",
    "温暖稳定的歌声，在清新感与成熟表达之间取得平衡。",
    "充满爆发力的舞台能量、明亮音色与大胆自信，留下鲜明记忆点。",
  ],
  th: [
    "โดดเด่นด้วยจังหวะที่คมชัด ความนิ่งบนเวที และเส้นสายการเต้นที่ทรงพลัง",
    "น้ำเสียงใสและบุคลิกสง่างามช่วยเติมรายละเอียดที่สว่างและนุ่มนวลให้เพลง",
    "เคลื่อนไหวระหว่างแร็ป การเต้น และการสร้างสรรค์อย่างเป็นธรรมชาติด้วยจังหวะเฉพาะตัว",
    "ศิลปินรอบด้านที่เปลี่ยนพลังระหว่างเสียงสูง แร็ป และการคุมเวทีได้อย่างมั่นใจ",
    "เสียงที่ลึกและเต็มไปด้วยอารมณ์ช่วยพาเรื่องราวของเพลงไปไกลยิ่งขึ้น",
    "เสียงร้องอบอุ่นและมั่นคง ผสมความสดใสกับการถ่ายทอดที่เป็นผู้ใหญ่",
    "พลังเวทีระเบิด น้ำเสียงสดใส และความมั่นใจสร้างภาพจำที่ชัดเจน",
  ],
  en: [
    "Calm, razor-sharp rhythm, steady stage presence, and powerful dance lines define her performance.",
    "A clear vocal color and graceful stage presence add a bright, delicate layer to every song.",
    "She moves naturally between rap, dance, and creative expression with unmistakable rhythmic character.",
    "An all-round performer who shifts confidently between high notes, rap, and commanding stage energy.",
    "Her rich, emotional vocal color carries each song toward a deeper and more expressive place.",
    "A warm, stable voice balances refreshing brightness with a mature sense of expression.",
    "Explosive stage energy, a bright vocal color, and fearless confidence create an instant impression.",
  ],
  ko: [
    "차분하고 날카로운 리듬 감각, 안정적인 무대 존재감과 힘 있는 춤선이 돋보입니다.",
    "맑은 음색과 우아한 무대 분위기로 곡에 섬세하고 밝은 결을 더합니다.",
    "랩, 댄스와 창작 표현을 자연스럽게 넘나들며 선명한 리듬을 만듭니다.",
    "고음, 랩과 무대 장악력을 자신 있게 오가는 올라운드 퍼포머입니다.",
    "깊고 감성적인 음색으로 곡의 이야기를 한층 더 깊게 이끕니다.",
    "따뜻하고 안정적인 목소리로 청량함과 성숙한 표현을 균형 있게 보여 줍니다.",
    "폭발적인 무대 에너지와 밝은 음색, 대담한 자신감으로 강한 인상을 남깁니다.",
  ],
  ja: [
    "落ち着いた鋭いリズム感、安定した存在感、力強いダンスラインが魅力です。",
    "透明感のある声と優雅なステージングで、楽曲に繊細で明るい色を加えます。",
    "ラップ、ダンス、クリエイティブな表現を自在に行き来し、鮮明なリズムを描きます。",
    "高音、ラップ、ステージ掌握力を自信を持って切り替えるオールラウンドな表現者です。",
    "深く感情豊かな声で、楽曲の物語をさらに奥へと導きます。",
    "温かく安定した歌声で、爽やかさと成熟した表現を両立します。",
    "爆発的なステージエネルギー、明るい音色、大胆な自信で強い印象を残します。",
  ],
};
