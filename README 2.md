# MONSTIEZ TAIWAN

非官方 BABYMONSTER 粉絲交流網站。包含官方 Spotify 播放器、YouTube／Instagram 連結、官方資料整理、近期活動、會員註冊、社群登入流程、留言與按讚。

## 版權原則

- 不重新上傳音樂、MV、完整歌詞或官方照片。
- 音樂與影片使用官方平台的嵌入／連結，流量回到權利人的官方帳號。
- 成員與活動資料以 YG Entertainment、BABYMONSTER 官方網站為準。
- 本站明確標示為非官方粉絲站，不使用官方標誌假冒官方服務。
- 使用者不得張貼盜版連結、個資、私生內容或未授權商業素材。

## 本機執行

需要 Node.js 22.13 以上。

```bash
npm ci
npm run dev
```

網站使用 Cloudflare D1 儲存會員、登入工作階段、留言與按讚。開發服務會提供本機 D1 環境。

## 社群登入設定

複製 `.env.example` 為 `.env`，並向 Google、Kakao Developers、微信開放平台申請 OAuth 應用。回呼網址格式：

```text
https://你的網域/api/auth/oauth/callback?provider=google
https://你的網域/api/auth/oauth/callback?provider=kakao
https://你的網域/api/auth/oauth/callback?provider=wechat
```

請勿把任何 Client Secret 提交到 GitHub。正式環境的金鑰應放在部署平台的加密環境變數中。

## 部署說明

這不是純靜態頁面：會員、留言、按讚與 OAuth 回呼都需要伺服器與 D1，因此 GitHub Pages 無法單獨承載完整功能。GitHub 可作為原始碼儲存庫，再由支援 Cloudflare Worker／D1 的部署平台發布。

## 資料來源

- [YG Entertainment — BABYMONSTER](https://ygfamily.com/ko/artists/babymonster/profile)
- [BABYMONSTER Japan Official](https://yg-babymonster-official.jp/)
- [Spotify Official Artist](https://open.spotify.com/artist/1SIocsqdEefUTE6XKGUiVS)
- [YouTube Official Artist Channel](https://www.youtube.com/@BABYMONSTER)
- [Instagram Official](https://www.instagram.com/babymonster_ygofficial/)
