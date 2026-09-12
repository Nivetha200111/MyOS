import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nivetha OS | The pink edit",
  description:
    "A focused operating system for engineering, health, and a life of your own.",
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
    <html lang="en" className="pink-edit">
      <body className="antialiased">{children}</body>
    </html>
  );
}
