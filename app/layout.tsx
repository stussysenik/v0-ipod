import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { BuildVersionBadge } from "@/components/build-version-badge";
import { ServiceWorkerCleanup } from "@/components/service-worker-cleanup";

import type { Metadata, Viewport } from "next";
// Preflight reset — the UnoCSS replacement for `@tailwind base`, dropped in the
// engine migration. Must load first so utilities (uno.css) and component CSS
// (globals.css) win in the cascade. Without it, native `<button>` chrome, the
// default body margin, and `content-box` sizing leak through the device.
import "@unocss/reset/tailwind.css";
import "./uno.css";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

function resolveDeployVersion(): string {
	const explicitVersion = process.env.NEXT_PUBLIC_DEPLOY_VERSION?.trim();
	if (explicitVersion) {
		return explicitVersion;
	}

	const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
	const deploymentId = process.env.VERCEL_DEPLOYMENT_ID?.slice(-6);
	const deploymentUrlToken = process.env.VERCEL_URL?.replace(/\.vercel\.app$/i, "")
		.split("-")
		.at(-1);
	const deploymentStamp = deploymentId ?? deploymentUrlToken;

	const parts = [commit, deploymentStamp].filter(
		(part): part is string => !!part && part.trim().length > 0,
	);

	if (parts.length === 0) {
		return "dev";
	}

	return parts.join("-");
}

const deployVersion = resolveDeployVersion();
const shouldRenderAnalytics = process.env.NODE_ENV === "production" && process.env.VERCEL === "1";

export const viewport: Viewport = {
	themeColor: "#000000",
	width: "device-width",
	initialScale: 1,
	// Pinch-zoom stays enabled (WCAG 1.4.4). The click wheel and 3D canvas set
	// `touch-action: none` on their own surfaces, so re-enabling page zoom does
	// not hijack drag gestures there.
	maximumScale: 5,
	userScalable: true,
};

export const metadata: Metadata = {
	title: "iPod Snapshot",
	description: "iPod Snapshot - Classic simulator and export studio",
	manifest: "/manifest.webmanifest",
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

import { IpodStoreProvider } from "@/lib/xstate/store";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" data-deploy-version={deployVersion}>
			<body
				className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
			>
				<IpodStoreProvider>
					<ServiceWorkerCleanup deployVersion={deployVersion} />
						{children}
						<BuildVersionBadge initialVersion={deployVersion} />
						<Toaster
							position="bottom-center"
							richColors={false}
							closeButton={false}
							visibleToasts={2}
							duration={2200}
							toastOptions={{
								style: {
									border: "1px solid rgba(0,0,0,0.14)",
									background: "rgba(247,247,245,0.94)",
									color: "rgba(0,0,0,0.82)",
									boxShadow: "0 10px 22px rgba(0,0,0,0.14)",
									backdropFilter: "blur(8px)",
								},
							}}
						/>
					{shouldRenderAnalytics ? <Analytics /> : null}
				</IpodStoreProvider>
			</body>
		</html>
	);
}
