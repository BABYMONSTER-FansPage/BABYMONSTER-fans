import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MONSTIEZ TAIWAN｜BABYMONSTER 非官方粉絲站",
  description: "認識 BABYMONSTER、收聽官方音樂、追蹤近期活動，和全球 MONSTIEZ 一起交流。",
  openGraph: {
    title: "MONSTIEZ TAIWAN",
    description: "Seven voices. One monster energy. 非官方 BABYMONSTER 粉絲交流站。",
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "MONSTIEZ TAIWAN unofficial BABYMONSTER fan community" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
