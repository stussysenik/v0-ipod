// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import nextConfig from "eslint-config-next";

import { sharedTsRules } from "@ipod/config/eslint";

const eslintConfig = [
	// Must be first: global ignores
	{
		ignores: [
			"**/.next/**",
			"**/.next-dev/**",
			"**/node_modules/**",
			"**/public/**",
			"scripts/**",
			"**/ipod-classic.tsx",
		],
	},
	...nextConfig,
	{
		files: ["**/*.ts", "**/*.tsx"],
		rules: sharedTsRules,
	},
	// Three.js / R3F components use imperative patterns (geometry, textures)
	{
		files: [
			"packages/components/three/three-d-ipod.tsx",
			"packages/components/three/post-processing.tsx",
		],
		rules: {
			"react-hooks/purity": "off",
			"react-hooks/immutability": "off",
		},
	},
	// image-upload uses raw <img> for html-to-image export compatibility
	{
		files: ["packages/components/ipod/editors/image-upload.tsx"],
		rules: {
			"@next/next/no-img-element": "off",
		},
	},
	...storybook.configs["flat/recommended"],
];

export default eslintConfig;
