import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next Create App",
  description: "AI-powered full-stack scaffold",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="theme-color" content="#0A0A0F" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-screen overflow-hidden antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-bg-elevated focus:text-primary-light focus:rounded-lg focus:shadow-lg focus:border focus:border-primary/30"
        >
          跳到主要内容
        </a>
        {children}
      </body>
    </html>
  );
}
