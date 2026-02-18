import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { ServiceWorkerCleanup } from "@/components/service-worker-cleanup";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const deployVersion =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
  process.env.NEXT_PUBLIC_DEPLOY_VERSION ??
  "dev";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "iPod Snapshot",
  description: "iPod Snapshot - Classic simulator and export studio",
  manifest: `/manifest.webmanifest?v=${deployVersion}`,
  generator: "v0.app",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "iPod Snapshot",
  },
  icons: {
    icon: [
      {
        url: `/icon.svg?v=${deployVersion}`,
        type: "image/svg+xml",
      },
      {
        url: `/icon-192x192.png?v=${deployVersion}`,
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: `/apple-icon.png?v=${deployVersion}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ServiceWorkerCleanup deployVersion={deployVersion} />
        {children}
        <Toaster position="bottom-center" richColors />
        <Analytics />
      </body>
    </html>
  );
}
