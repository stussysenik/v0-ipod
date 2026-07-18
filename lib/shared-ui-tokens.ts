import manifestData from "@/tokens/shared-ui.json";

import { contrastRatio } from "@/lib/studio-control-tokens";

export interface IconButtonAppearance {
	border: string;
	background: string;
	foreground: string;
	shadow: string;
}

export interface IconButtonVariantTokens extends IconButtonAppearance {
	hover?: IconButtonAppearance;
}

interface IconButtonTokens {
	size: number;
	radius: number;
	motion: {
		durationMs: number;
		hoverScale: number;
		activeScale: number;
		pressScale: number;
	};
	badge: {
		border: string;
		background: string;
		foreground: string;
		shadow: string;
	};
	tooltip: {
		border: string;
		background: string;
		foreground: string;
		shadow: string;
	};
	variants: {
		default: IconButtonVariantTokens;
		/** Resting `default` chrome for a dark device — see {@link resolveIconButtonVariant}. */
		defaultDark: IconButtonVariantTokens;
		contrast: IconButtonVariantTokens;
		active: IconButtonVariantTokens;
	};
}

interface SharedUiManifest {
	iconButton: IconButtonTokens;
}

export const sharedUiTokens = manifestData as SharedUiManifest;
export const sharedIconButtonTokens = sharedUiTokens.iconButton;

/** The three appearance states an {@link IconButton} resolves to from its props. */
export type IconButtonVariantName = "default" | "contrast" | "active";

/**
 * Is this surface dark enough that light-on-dark chrome reads better than the
 * default light gradient? A colour is "dark" when it contrasts more with white
 * than with black — decided through the repo's WCAG contrast authority so there
 * is one luminance model, not two. Works for any case colour (the product lets
 * the shell be an arbitrary hex), not just a black/white toggle.
 */
export function isDarkChrome(caseColor: string): boolean {
	return contrastRatio(caseColor, "#FFFFFF") >= contrastRatio(caseColor, "#000000");
}

/**
 * Appearance tokens for an IconButton. Only the resting `default` variant is
 * theme-aware: on a dark device it swaps to the dark-filled set so the toolbar
 * matches the shell. `active`/`contrast` are already dark and stay invariant.
 */
export function resolveIconButtonVariant(
	variant: IconButtonVariantName,
	darkChrome: boolean,
): IconButtonVariantTokens {
	if (variant === "default" && darkChrome) {
		return sharedIconButtonTokens.variants.defaultDark;
	}
	return sharedIconButtonTokens.variants[variant];
}
