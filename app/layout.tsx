import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://babymonster.fans"),
  title: "Monstiez",
  description: "認識 BABYMONSTER、收聽官方音樂、追蹤近期活動，和全球 MONSTIEZ 一起交流。",
  openGraph: {
    title: "Monstiez",
    description: "Seven voices. One monster energy. 非官方 BABYMONSTER 粉絲交流站。",
    type: "website",
    images: [{ url: "/og.png", width: 1730, height: 909, alt: "Monstiez unofficial BABYMONSTER fan community" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  alternates: { canonical: "https://babymonster.fans/" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
