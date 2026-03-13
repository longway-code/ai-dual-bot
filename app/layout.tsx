import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 双机器人对话",
  description: "两个 AI 自动轮流聊天",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
