import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { BuildVersionBadge } from "@/components/build-version-badge";
import { ServiceWorkerCleanup } from "@/components/service-worker-cleanup";

import type { Metadata, Viewport } from "next";
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
		<html data-deploy-version={deployVersion} lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
			>
				<ServiceWorkerCleanup deployVersion={deployVersion} />
				{children}
				<BuildVersionBadge initialVersion={deployVersion} />
				<Toaster
					closeButton={false}
					duration={2200}
					position="bottom-center"
					richColors={false}
					toastOptions={{
						style: {
							border: "1px solid rgba(0,0,0,0.14)",
							background: "rgba(247,247,245,0.94)",
							color: "rgba(0,0,0,0.82)",
							boxShadow: "0 10px 22px rgba(0,0,0,0.14)",
							backdropFilter: "blur(8px)",
						},
					}}
					visibleToasts={2}
				/>
				<Analytics />
			</body>
		</html>
	);
}
