import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ChoreBoardProvider } from "@/lib/ChoreBoardContext";
import { ServiceWorker } from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "ChoreBoard",
  description: "Family chores & allowance — local-first, your data stays yours.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ChoreBoard" },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ChoreBoardProvider>{children}</ChoreBoardProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
