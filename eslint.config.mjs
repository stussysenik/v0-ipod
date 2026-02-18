import nextConfig from "eslint-config-next";
import prettier from "eslint-config-prettier";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const eslintConfig = [
  // Must be first: global ignores
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "playwright-report/**",
      "test-results/**",
      "scripts/**",
      "ipod-classic.tsx",
      "components/ipod-form.tsx",
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
  },
  // Three.js / R3F components use imperative patterns (geometry, textures)
  {
    files: ["components/three/three-d-ipod.tsx", "components/three/post-processing.tsx"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
    },
  },
  // image-upload uses raw <img> for html-to-image export compatibility
  {
    files: ["components/ipod/image-upload.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
