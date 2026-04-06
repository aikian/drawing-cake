import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "드로잉케이크 — AI 커스텀 케이크·도넛",
  description: "AI로 이미지를 생성하거나 직접 그려서 나만의 케이크와 도넛을 만들어보세요. 대구 남구 대명동 즉석 커스텀 베이커리.",
  keywords: ["커스텀케이크", "AI케이크", "도넛", "대명동", "대구케이크"],
  openGraph: {
    title: "드로잉케이크",
    description: "AI × 미술 융합 즉석 커스텀 케이크·도넛",
    siteName: "드로잉케이크",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
