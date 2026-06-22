import type { Config } from "tailwindcss";

import preset from "@ipod/config/tailwind";

// all in fixtures is set to tailwind v3 as interims solutions
const config: Config = {
	presets: [preset],
	content: [
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"../../packages/components/**/*.{js,ts,jsx,tsx,mdx}",
		"../../packages/lib/**/*.{js,ts,jsx,tsx}",
		"../../packages/hooks/**/*.{js,ts,jsx,tsx}",
	],
};

export default config;
