import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DeviceProvider } from "@/shell/DeviceProvider";
import { PersonaContactsProvider } from "@/shell/PersonaContactsProvider";
import { ThemeProvider } from "@/shell/ThemeProvider";
import { VaultLockProvider } from "@/shell/VaultLockProvider";
import { ServiceWorker } from "@/templates/choreboard/components/ServiceWorker";

export const metadata: Metadata = {
  title: "Rooms — local-first for small groups",
  description: "Encrypted rooms on your devices. Dumb relay sync only.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Rooms" },
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
        <ThemeProvider>
          <VaultLockProvider>
            <DeviceProvider>
              <PersonaContactsProvider>{children}</PersonaContactsProvider>
            </DeviceProvider>
          </VaultLockProvider>
        </ThemeProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
