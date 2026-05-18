// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
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
	},
	...storybook.configs["flat/recommended"],
];

export default eslintConfig;
