import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { ServiceWorkerCleanup } from "@/components/service-worker-cleanup";
import { BuildVersionBadge } from "@/components/build-version-badge";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

function resolveDeployVersion(): string {
  const explicitVersion = process.env.NEXT_PUBLIC_DEPLOY_VERSION?.trim();
  if (explicitVersion) {
    return explicitVersion;
  }

  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID?.slice(-6);
  const deploymentUrlToken = process.env.VERCEL_URL
    ?.replace(/\.vercel\.app$/i, "")
    .split("-")
    .at(-1);
  const deploymentStamp = deploymentId || deploymentUrlToken;

  const parts = [commit, deploymentStamp].filter(
    (part): part is string => !!part && part.trim().length > 0,
  );

  if (parts.length === 0) {
    return "dev";
  }

  return parts.join("-");
}

const deployVersion = resolveDeployVersion();

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
        <BuildVersionBadge initialVersion={deployVersion} />
        <Toaster position="bottom-center" richColors />
        <Analytics />
      </body>
    </html>
  );
}
