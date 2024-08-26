import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../lib/env";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Where In The World",
  description: "Find your friends, places to travel to, and live.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-gray-900`}>{children}</body>
    </html>
  );
}