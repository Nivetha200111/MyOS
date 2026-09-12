import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nivetha OS | Your personal control center",
  description:
    "A focused operating system for engineering, health, and a life of your own.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
