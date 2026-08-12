# Google OAuth 品牌驗證設定

請在 Google Cloud Console → Google Auth Platform 逐項使用以下值。大小寫、網址路徑與結尾斜線請保持一致。

## Branding

- App name：`Monstiez`
- User support email：`support@babymonster.fans`
- App homepage：`https://babymonster.fans/`
- App privacy policy：`https://babymonster.fans/privacy.html`
- App terms of service：`https://babymonster.fans/terms.html`
- Authorized domains：`babymonster.fans`
- Developer contact email：`support@babymonster.fans`
- App logo：使用與網站 `/favicon.svg` 相同的 Monstiez「M」圖形，不要使用 BABYMONSTER、YG 或 Google 的官方標誌。

不要將 Homepage 設為 `www.babymonster.fans`、`m.babymonster.fans`、GitHub Pages 網址或其他會重新導向的網址。

## Data Access

網站登入程式只使用 `openid email profile`。Google Auth Platform 的 Data Access 應只保留下列基本 scope：

- `openid`
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`

移除 Gmail、Google Drive、Google Calendar 或其他網站沒有使用的 scope。

## Domain verification

在 Google Search Console 驗證 `babymonster.fans` 的 Domain property。執行驗證的 Google 帳號必須同時是該 Google Cloud 專案的 Owner 或 Editor。驗證完成後再提交品牌驗證。

## 提交前檢查

1. 使用無痕視窗開啟 `https://babymonster.fans/`，確認不登入即可看到 Monstiez 名稱、用途、功能、Google 資料用途、Privacy Policy 與 Terms of Service。
2. 確認 OAuth 同意畫面顯示的名稱為 `Monstiez`，圖示與網站的 Monstiez「M」圖形一致。
3. 確認 Privacy Policy URL 與首頁連結完全相同：`https://babymonster.fans/privacy.html`。
4. 確認首頁沒有重新導向到其他網域，且 HTTPS 正常。
5. 若先前的驗證仍在進行中，先取消舊驗證、儲存新版 Branding，再重新提交。
6. 不要在短時間內反覆送出；修正完成後一次重新提交，並留意專案 Owner／Editor 信箱與垃圾郵件匣。

官方參考：

- https://support.google.com/cloud/answer/13807376?hl=zh-Hant
- https://support.google.com/cloud/answer/13804963?hl=zh-Hant
