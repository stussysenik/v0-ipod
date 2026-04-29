// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import nextConfig from "eslint-config-next";
import prettier from "eslint-config-prettier";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importX from "eslint-plugin-import-x";
import unicornPlugin from "eslint-plugin-unicorn";

// Files outside the main tsconfig — no type-aware rules
const OUT_OF_PROJECT_FILES = [
	"stories/**/*.ts",
	"stories/**/*.tsx",
	".storybook/**/*.ts",
	".storybook/**/*.tsx",
	"figma/code-connect/**/*.ts",
	"figma/code-connect/**/*.tsx",
	"tests/**/*.ts",
	"tests/**/*.tsx",
];

const sharedTsRules = {
	// TypeScript non-type-aware rules
	"@typescript-eslint/no-unused-vars": [
		"error",
		{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
	],
	"@typescript-eslint/no-explicit-any": "error",
	"@typescript-eslint/consistent-type-imports": [
		"error",
		{ prefer: "type-imports", fixStyle: "inline-type-imports" },
	],
	"@typescript-eslint/no-import-type-side-effects": "error",
	"@typescript-eslint/consistent-type-definitions": ["error", "interface"],
	"@typescript-eslint/explicit-function-return-type": "off",
	"@typescript-eslint/no-non-null-assertion": "warn",

	// React/Next.js rules
	"react/no-unescaped-entities": "off",
	"react-hooks/set-state-in-effect": "off",
	"react/jsx-sort-props": [
		"warn",
		{
			callbacksLast: true,
			shorthandFirst: true,
			noSortAlphabetically: false,
			reservedFirst: true,
		},
	],

	// General best practices
	"prefer-const": "error",
	"no-console": ["warn", { allow: ["warn", "error", "info"] }],
	"no-var": "error",
	"object-shorthand": ["error", "always"],
	"prefer-arrow-callback": "error",
	"prefer-destructuring": ["warn", { object: true, array: false }],
	"prefer-template": "error",
	"sort-imports": [
		"warn",
		{
			ignoreDeclarationSort: true,
			ignoreMemberSort: false,
		},
	],

	// Import rules (via eslint-plugin-import-x, ESLint 10 compatible)
	"import-x/first": "error",
	"import-x/newline-after-import": "error",
	"import-x/no-duplicates": "error",
	"import-x/order": [
		"warn",
		{
			groups: [
				"builtin",
				"external",
				"internal",
				["parent", "sibling", "index"],
				"type",
			],
			"newlines-between": "always",
			alphabetize: { order: "asc", caseInsensitive: true },
		},
	],

	// Unicorn rules for code quality
	"unicorn/better-regex": "error",
	"unicorn/catch-error-name": "error",
	"unicorn/consistent-function-scoping": "warn",
	"unicorn/error-message": "error",
	"unicorn/escape-case": "error",
	"unicorn/explicit-length-check": "error",
	"unicorn/filename-case": [
		"error",
		{
			case: "kebabCase",
			ignore: ["^\\.env", "README", "Dockerfile", "^next-env"],
		},
	],
	"unicorn/new-for-builtins": "error",
	"unicorn/no-array-for-each": "warn",
	"unicorn/no-array-reduce": "off",
	"unicorn/no-instanceof-array": "error",
	"unicorn/no-invalid-remove-event-listener": "error",
	"unicorn/no-lonely-if": "warn",
	"unicorn/no-nested-ternary": "off",
	"unicorn/no-new-array": "error",
	"unicorn/no-new-buffer": "error",
	"unicorn/no-null": "off",
	"unicorn/no-object-as-default-parameter": "error",
	"unicorn/no-typeof-undefined": "error",
	"unicorn/no-unnecessary-await": "error",
	"unicorn/no-useless-fallback-in-spread": "error",
	"unicorn/no-useless-length-check": "error",
	"unicorn/no-useless-spread": "error",
	"unicorn/no-useless-switch-case": "error",
	"unicorn/prefer-add-event-listener": "error",
	"unicorn/prefer-array-find": "error",
	"unicorn/prefer-array-flat-map": "error",
	"unicorn/prefer-array-index-of": "error",
	"unicorn/prefer-array-some": "error",
	"unicorn/prefer-at": "error",
	"unicorn/prefer-blob-reading-methods": "error",
	"unicorn/prefer-code-point": "error",
	"unicorn/prefer-date-now": "error",
	"unicorn/prefer-default-parameters": "error",
	"unicorn/prefer-export-from": "error",
	"unicorn/prefer-includes": "error",
	"unicorn/prefer-keyboard-event-key": "error",
	"unicorn/prefer-logical-operator-over-ternary": "error",
	"unicorn/prefer-math-trunc": "error",
	"unicorn/prefer-modern-dom-apis": "error",
	"unicorn/prefer-modern-math-apis": "error",
	"unicorn/prefer-native-coercion-functions": "error",
	"unicorn/prefer-negative-index": "error",
	"unicorn/prefer-node-protocol": "off",
	"unicorn/prefer-number-properties": "error",
	"unicorn/prefer-optional-catch-binding": "error",
	"unicorn/prefer-prototype-methods": "error",
	"unicorn/prefer-query-selector": "error",
	"unicorn/prefer-reflect-apply": "error",
	"unicorn/prefer-regexp-test": "error",
	"unicorn/prefer-set-has": "error",
	"unicorn/prefer-spread": "error",
	"unicorn/prefer-string-replace-all": "error",
	"unicorn/prefer-string-slice": "error",
	"unicorn/prefer-string-starts-ends-with": "error",
	"unicorn/prefer-string-trim-start-end": "error",
	"unicorn/prefer-structured-clone": "error",
	"unicorn/prefer-switch": "error",
	"unicorn/prefer-ternary": "warn",
	"unicorn/prefer-top-level-await": "error",
	"unicorn/relative-url-style": "error",
	"unicorn/require-array-join-separator": "error",
	"unicorn/require-number-to-fixed-digits-argument": "error",
	"unicorn/template-indent": "warn",
	"unicorn/text-encoding-identifier-case": "error",
	"unicorn/throw-new-error": "error",
};

const eslintConfig = [
  // Must be first: global ignores
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "scripts/**",
      "ipod-classic.tsx",
    ],
  },
  ...nextConfig,
  prettier,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
    },
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
    files: ["components/three/three-d-ipod.tsx", "components/three/post-processing.tsx"],
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
