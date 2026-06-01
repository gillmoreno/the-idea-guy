import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Idea Guy — Real problems, better solutions, built with AI",
  description:
    "I find real problems, explain how they're solved today, then show how one person with modern AI can do it better — and teach the whole process in public.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
