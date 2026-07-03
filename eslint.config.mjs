// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import reactThree from "@react-three/eslint-plugin";
import storybook from "eslint-plugin-storybook";

import nextConfig from "eslint-config-next";

const eslintConfig = [
	// Must be first: global ignores
	{
		ignores: [
			".next/**",
			".next-dev/**",
			"node_modules/**",
			"public/**",
			"scripts/**",
			"ipod-classic.tsx",
		],
	},
	...nextConfig,
	{
		files: ["**/*.ts", "**/*.tsx"],
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"react/no-unescaped-entities": "off",
			"prefer-const": "warn",
			"no-console": ["warn", { allow: ["warn", "error", "info"] }],
			// setState in effects is needed for hydration-safe localStorage reads
			"react-hooks/set-state-in-effect": "off",
		},
	}, // Three.js / R3F components use imperative patterns (geometry, textures)
	{
		files: [
			"components/three/three-d-ipod.tsx",
			"components/three/post-processing.tsx",
		],
		rules: {
			"react-hooks/purity": "off",
			"react-hooks/immutability": "off",
		},
	}, // image-upload uses raw <img> for html-to-image export compatibility
	{
		files: ["components/ipod/editors/image-upload.tsx"],
		rules: {
			"@next/next/no-img-element": "off",
		},
	}, // R3F: flag per-frame allocations (new/clone inside useFrame) — the classic
	// three.js GC-churn footgun oxlint can't see. Scoped to the WebGL surfaces.
	{
		files: ["components/three/**/*.{ts,tsx}", "app/3d/**/*.{ts,tsx}"],
		plugins: { "@react-three": reactThree },
		rules: {
			"@react-three/no-clone-in-loop": "error",
			"@react-three/no-new-in-loop": "error",
		},
	},
	...storybook.configs["flat/recommended"],
];

export default eslintConfig;
