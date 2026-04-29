/**
 * Shared helpers for CSF3 stories.
 *
 * `compat` classifies a story for the Figma bridge:
 *   - "satori":  participates in Phase 2 HMR; pushed as editable vectors
 *   - "raster":  Phase 1 push only, rasterized, skipped by HMR
 *   - "exclude": never appears in Figma; documented on the "Not In Scope" page
 *
 * `design` holds the Figma URL that addon-designs embeds in the Docs panel.
 * Phase 1 bootstrap fills in the real URL; prior to that we use a placeholder
 * pointing at the canonical file referenced in docs/figma/file-manifest.md.
 */
export type FigmaCompat = "satori" | "raster" | "exclude";

export interface FigmaDesignLink {
	type: "figma";
	url: string;
}

export const PLACEHOLDER_FIGMA_URL =
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1";

export function designLink(nodeId?: string): FigmaDesignLink {
	const base = PLACEHOLDER_FIGMA_URL;
	if (!nodeId) return { type: "figma", url: base };
	return {
		type: "figma",
		url: `${base.split("?")[0]}?node-id=${encodeURIComponent(nodeId)}`,
	};
}

export function compatParameters(compat: FigmaCompat, nodeId?: string) {
	return {
		compat,
		...(compat === "exclude" ? {} : { design: designLink(nodeId) }),
	};
}
