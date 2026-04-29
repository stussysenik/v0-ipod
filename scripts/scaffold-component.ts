#!/usr/bin/env bun
/**
 * Stamp out a new component + story + Code Connect mapping + token audit
 * entry in one shot. The scaffolder is the supported entry point for any
 * new visual component so that the four artifacts stay in lock-step.
 *
 *   bun run scaffold:component <kebab-name>
 *
 * Creates:
 *   - components/ipod/<kebab>.tsx          (basic typed function component)
 *   - stories/<kebab>.stories.tsx          (CSF3 with compatParameters)
 *   - figma/code-connect/<kebab>.figma.tsx (minimal mapping)
 *   - appends a row to docs/figma/component-audit.md (satori bucket)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const AUDIT = resolve(REPO_ROOT, "docs/figma/component-audit.md");

function exit(message: string, code = 1): never {
	// eslint-disable-next-line no-console
	console.error(`[scaffold:component] ${message}`);
	process.exit(code);
}

function pascal(kebab: string): string {
	return kebab
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}

function writeFile(path: string, content: string): void {
	if (existsSync(path)) {
		exit(`${path.replace(REPO_ROOT + "/", "")} already exists`);
	}
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content, "utf8");
	// eslint-disable-next-line no-console
	console.log(`[scaffold:component] wrote ${path.replace(REPO_ROOT + "/", "")}`);
}

function main(): void {
	const name = process.argv[2];
	if (!name) exit("usage: bun run scaffold:component <kebab-name>");
	if (!/^[a-z][a-z0-9-]*$/.test(name)) {
		exit(`component name must be kebab-case (got "${name}")`);
	}

	const Name = pascal(name);
	const componentPath = resolve(REPO_ROOT, `components/ipod/${name}.tsx`);
	const storyPath = resolve(REPO_ROOT, `stories/${name}.stories.tsx`);
	const mappingPath = resolve(REPO_ROOT, `figma/code-connect/${name}.figma.tsx`);

	const componentSource = `"use client";

interface ${Name}Props {
  label?: string;
}

export function ${Name}({ label = "${Name}" }: ${Name}Props) {
  return (
    <div
      data-testid="${name}"
      className="flex items-center justify-center rounded-md border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#161616]"
    >
      {label}
    </div>
  );
}
`;

	const storySource = `import type { Meta, StoryObj } from "@storybook/react";
import { ${Name} } from "@/components/ipod/${name}";
import { compatParameters } from "../.storybook/shared";

const meta = {
  title: "iPod/${Name}",
  component: ${Name},
  tags: ["autodocs"],
  parameters: compatParameters("satori"),
  args: {
    label: "${Name}",
  },
} satisfies Meta<typeof ${Name}>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
`;

	const mappingSource = `import figma from "@figma/code-connect";
import { ${Name} } from "@/components/ipod/${name}";

figma.connect(
  ${Name},
  "https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
  {
    props: {
      label: figma.string("label"),
    },
    example: ({ label }) => <${Name} label={label} />,
  },
);
`;

	writeFile(componentPath, componentSource);
	writeFile(storyPath, storySource);
	writeFile(mappingPath, mappingSource);

	// Append a token audit entry
	if (existsSync(AUDIT)) {
		const audit = readFileSync(AUDIT, "utf8");
		const row = `| \`${name}\`${" ".repeat(Math.max(0, 44 - name.length))}| \`components/ipod/${name}.tsx\`${" ".repeat(Math.max(0, 42 - name.length))}| Scaffolded ${new Date().toISOString().slice(0, 10)}.                                                  |\n`;
		const marker = "## In Scope — `satori`";
		const idx = audit.indexOf(marker);
		if (idx !== -1) {
			// Insert after the last row of the satori table. Find the first blank
			// line after the marker that ends the table.
			const tableStart = audit.indexOf("\n|", idx);
			const tableEnd = audit.indexOf("\n\n", tableStart);
			if (tableStart !== -1 && tableEnd !== -1) {
				const updated =
					audit.slice(0, tableEnd) +
					"\n" +
					row +
					audit.slice(tableEnd);
				writeFileSync(AUDIT, updated, "utf8");
				// eslint-disable-next-line no-console
				console.log(
					`[scaffold:component] updated docs/figma/component-audit.md`,
				);
			}
		}
	}

	// eslint-disable-next-line no-console
	console.log(`
[scaffold:component] Next steps:
  1. Implement the component in components/ipod/${name}.tsx
  2. Refine the story variants in stories/${name}.stories.tsx
  3. Refine the Code Connect mapping in figma/code-connect/${name}.figma.tsx
  4. Reclassify in docs/figma/component-audit.md if the component is not satori-compatible
  5. Run bun run validate
`);
}

main();
