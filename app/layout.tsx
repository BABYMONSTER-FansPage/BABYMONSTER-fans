import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://babymonster.fans"),
  title: "Monstiez",
  description: "Monstiez 是提供 BABYMONSTER 粉絲交流、留言與內容瀏覽的非官方粉絲社群平台，支援帳號登入、暱稱、留言板、按讚、個人資料管理與官方內容連結整理。",
  keywords: ["Monstiez", "BABYMONSTER", "MONSTIEZ fan community", "BABYMONSTER fans", "BABYMONSTER Spotify", "BABYMONSTER YouTube", "BABYMONSTER Instagram"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  openGraph: {
    title: "Monstiez",
    description: "Monstiez 是提供 BABYMONSTER 粉絲交流、留言與內容瀏覽的非官方粉絲社群平台。",
    url: "https://babymonster.fans/",
    siteName: "Monstiez",
    locale: "zh_TW",
    type: "website",
    images: [{ url: "/og.png", width: 1730, height: 909, alt: "Monstiez unofficial BABYMONSTER fan community" }],
  },
  twitter: { card: "summary_large_image", title: "Monstiez", description: "Monstiez 是提供 BABYMONSTER 粉絲交流、留言與內容瀏覽的非官方粉絲社群平台。", images: ["/og.png"] },
  alternates: { canonical: "https://babymonster.fans/" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
