import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";

const withVanillaExtract = createVanillaExtractPlugin();

const distDir = process.env.NEXT_DIST_DIR?.trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
	...(distDir ? { distDir } : {}),
	experimental: {
		viewTransition: true,
		useOxc: true,
		optimizePackageImports: [
			"unocss",
			"lucide-react",
			"@radix-ui/react-accordion",
			"@radix-ui/react-alert-dialog",
			"@radix-ui/react-aspect-ratio",
			"@radix-ui/react-avatar",
			"@radix-ui/react-checkbox",
			"@radix-ui/react-collapsible",
			"@radix-ui/react-context-menu",
			"@radix-ui/react-dialog",
			"@radix-ui/react-dropdown-menu",
			"@radix-ui/react-hover-card",
			"@radix-ui/react-label",
			"@radix-ui/react-menubar",
			"@radix-ui/react-navigation-menu",
			"@radix-ui/react-popover",
			"@radix-ui/react-progress",
			"@radix-ui/react-radio-group",
			"@radix-ui/react-scroll-area",
			"@radix-ui/react-select",
			"@radix-ui/react-separator",
			"@radix-ui/react-slider",
			"@radix-ui/react-slot",
			"@radix-ui/react-switch",
			"@radix-ui/react-tabs",
			"@radix-ui/react-toast",
			"@radix-ui/react-toggle",
			"@radix-ui/react-toggle-group",
			"@radix-ui/react-tooltip",
		],
	},
	images: {
		unoptimized: true,
	},
	async headers() {
		return [
			{
				source: "/sw.js",
				headers: [
					{
						key: "Cache-Control",
						value: "no-store, no-cache, must-revalidate",
					},
				],
			},
			{
				// Prevent stale HTML from edge/CDN caches
				source: "/((?!_next/static|_next/image|favicon.ico).*)",
				headers: [
					{
						key: "Cache-Control",
						value: "no-cache, no-store, must-revalidate",
					},
					{
						key: "Pragma",
						value: "no-cache",
					},
				],
			},
		];
	},
};

export default withVanillaExtract(nextConfig);
