// Shared ESLint rule set for the workspace.
export const sharedTsRules = {
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
};
