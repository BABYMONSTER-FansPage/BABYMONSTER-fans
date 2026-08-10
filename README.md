# MONSTIEZ GLOBAL

`https://babymonster.fans` 的非官方 BABYMONSTER 全球粉絲交流網站。前端以 GitHub Pages 純靜態發布；Supabase 提供帳號、資料庫、RLS 權限與留言翻譯 Edge Function，因此不需要自架伺服器。

## 本機啟動

需要 Node.js 22.13 以上版本。

```bash
npm ci
npm run dev
```

建立 GitHub Pages 版本：

```bash
npm run build
```

輸出位於 `dist-pages/`。

## 六種內建語言

固定網站內容內建繁體中文、簡體中文、泰文、英文、韓文及日文，不呼叫翻譯 API。只有粉絲留言會呼叫 `translate-comment` Edge Function；翻譯失敗時顯示原文，結果快取於 `post_translations`。

## Supabase 設定

1. 建立 Supabase 專案。
2. 依序套用：
   - `supabase/migrations/202608100001_monstiez_community.sql`
   - `supabase/migrations/202608100002_site_content_cms.sql`
   - `supabase/migrations/202608100003_inline_editing_content.sql`
   - `supabase/migrations/202608100004_profile_nickname_policy.sql`
   - `supabase/migrations/202608100005_site_content_albums.sql`
3. 部署 `supabase/functions/translate-comment`。若要自動抓 Spotify 最新專輯／單曲，也部署 `supabase/functions/spotify-releases`；若未部署或未設定 Spotify secrets，管理員仍可在後台手動新增專輯資料。
4. 在 Supabase Auth 的 URL Configuration 設定：
   - Site URL：`https://babymonster.fans`
   - Redirect URL：`https://babymonster.fans/**`
   - 開發用 Redirect URL：`http://localhost:5173/**`
5. 啟用 Email、Google 與 Kakao 登入。

前端只需要可公開的設定：

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

publishable key 會出現在瀏覽器中，這是預期行為；資料權限由 migration 內的 RLS policies 保護。禁止將 service role key 放入 `VITE_` 變數或 GitHub 原始碼。

翻譯服務金鑰只設定在 Supabase Edge Function secrets：

```text
TRANSLATION_API_URL
TRANSLATION_API_KEY
```

可使用自架 LibreTranslate。未設定時留言仍正常顯示原文。

Spotify 自動更新專輯／單曲需要 Supabase Edge Function，不能把 Spotify Client Secret 放到 GitHub Pages 前端。請在 Supabase secrets 設定：

```text
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
```

部署後，網站會呼叫 `spotify-releases` 取得 BABYMONSTER 官方 Spotify metadata，專輯圖使用 Spotify 回傳的圖片 URL，不下載進 repo。

## GitHub Pages

`.github/workflows/pages.yml` 會在 `main` 分支更新後建置並發布。請在 GitHub repository：

1. Settings → Pages → Source 選擇 GitHub Actions。
2. Settings → Secrets and variables → Actions → Variables，加入 repository variables：`VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`。
3. Pages 的 Custom domain 設為 `babymonster.fans`。
4. 在網域 DNS 依 GitHub Pages 畫面提供的 A/AAAA 或 ALIAS/ANAME 記錄設定 apex domain，確認 HTTPS 後啟用 Enforce HTTPS。

`public/CNAME` 已包含 `babymonster.fans`，但仍需在 GitHub Pages 設定頁完成網域驗證。

## 帳號與權限

- `monstiez`：發文、按讚、編輯／刪除自己的留言及檢舉。
- `artist`：藍色驗證勾；角色由資料庫管理。
- `admin`：紅色驗證勾；可審核與隱藏留言，也可開啟前台編輯模式修改公開文字與圖片、管理近期活動、新增文字／圖片／混合板塊。

使用者無法從前端更改角色。Supabase RLS 會在資料庫層再次驗證所有寫入。

將已註冊帳號設為管理員時，請在 Supabase SQL Editor 執行：

```sql
update public.profiles
set role = 'admin'
where id = 'USER_UUID';
```

登入 admin 帳號後，網站導覽列會出現鉛筆與齒輪按鈕。鉛筆會開啟前台編輯模式，每個可編輯文字或圖片旁會出現小鉛筆；齒輪保留給活動管理與品牌設定。圖片欄位請使用授權素材、官方允許嵌入或你有權使用的 CDN 圖片 URL；不要直接使用未授權官方照片或熱連 Google 圖片。

服務條款與隱私權政策是獨立靜態頁面：

- `/terms.html`
- `/privacy.html`

## 檢查

```bash
npm run lint
npm run build
node --test tests/*.test.mjs
```

## 版權原則

- 不重新上傳音樂、MV、完整歌詞或官方素材。
- Spotify 使用官方嵌入；YouTube 與 Instagram 連回官方帳號。
- 背景音樂為瀏覽器即時產生的原創占位音，不包含藝人音源。
- 本站不冒充官方、不販售官方素材，使用者不得發布盜版、個資或私生內容。
