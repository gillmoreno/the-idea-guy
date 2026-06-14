import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DeviceProvider } from "@/shell/DeviceProvider";
import { PersonaContactsProvider } from "@/shell/PersonaContactsProvider";
import { ThemeProvider } from "@/shell/ThemeProvider";
import { VaultLockProvider } from "@/shell/VaultLockProvider";
import { AppUpdater } from "@/shell/AppUpdater";
import { SplashScreen } from "@/shell/SplashScreen";

// Runs before first paint: if the launch splash already played this session,
// hide it synchronously so reloads/nav within a live session never replay it.
// Only a genuine cold start (new session) clears the flag and shows it again.
const SPLASH_GATE = `try{if(sessionStorage.getItem('rooms:splash-shown'))document.documentElement.classList.add('splash-seen')}catch(e){}`;

export const metadata: Metadata = {
  title: "Rooms — local-first for small groups",
  description: "Encrypted rooms on your devices. Dumb relay sync only.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Rooms" },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_GATE }} />
      </head>
      <body>
        <ThemeProvider>
          <VaultLockProvider>
            <DeviceProvider>
              <PersonaContactsProvider>{children}</PersonaContactsProvider>
            </DeviceProvider>
          </VaultLockProvider>
        </ThemeProvider>
        <SplashScreen />
        <AppUpdater />
      </body>
    </html>
  );
}
