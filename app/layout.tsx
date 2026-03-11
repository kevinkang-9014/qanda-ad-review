import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QANDA AD Review | 콴다 광고 소재 검수",
  description: "콴다 광고 소재를 업로드하고 가이드라인 준수 여부를 자동으로 검수합니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
