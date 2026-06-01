import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SecondBrainProvider } from "@/lib/SecondBrainContext";
import { ServiceWorker } from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "Second Brain",
  description: "Personal knowledge vault — local-first HTML notes, links, search, and AI.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Second Brain" },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SecondBrainProvider>{children}</SecondBrainProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
