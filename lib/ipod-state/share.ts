import type { IpodWorkbenchModel } from "./model";
import {
	PORTABLE_STATE_PARAM,
	decodePortableState,
	decodePortableStateJson,
	encodePortableState,
	encodePortableStateJson,
} from "./portable-state";

/**
 * Browser-side share/import surface over the portable-state codec (spec:
 * portable-customizer-state). Pure DOM side effects live here so the codec
 * stays isomorphic and the components stay thin.
 */

/**
 * One-shot URL restore: decode `?s=` if present, then strip the param so a later
 * reload follows the user's own persisted edits instead of re-imposing the link.
 * SSR-safe (returns null off-browser); malformed payloads decode to null and the
 * caller falls back to persisted state.
 */
export function consumePortableStateFromUrl(): IpodWorkbenchModel | null {
	if (typeof window === "undefined") return null;
	const url = new URL(window.location.href);
	const payload = url.searchParams.get(PORTABLE_STATE_PARAM);
	if (!payload) return null;
	url.searchParams.delete(PORTABLE_STATE_PARAM);
	window.history.replaceState(window.history.state, "", url);
	return decodePortableState(payload);
}

export function buildShareUrl(model: IpodWorkbenchModel): string {
	const url = new URL(window.location.href);
	url.search = "";
	url.searchParams.set(PORTABLE_STATE_PARAM, encodePortableState(model));
	return url.toString();
}

export async function copyShareLink(model: IpodWorkbenchModel): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(buildShareUrl(model));
		return true;
	} catch {
		return false;
	}
}

export function downloadConfigFile(model: IpodWorkbenchModel) {
	const blob = new Blob([encodePortableStateJson(model)], { type: "application/json" });
	const href = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = href;
	anchor.download = "ipod-config.json";
	anchor.click();
	URL.revokeObjectURL(href);
}

/** File-picker import. Accepts an exported JSON config or a bare share payload. */
export function pickConfigFile(): Promise<IpodWorkbenchModel | null> {
	return new Promise((resolve) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "application/json,.json,.txt";
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return resolve(null);
			const text = (await file.text()).trim();
			resolve(decodePortableStateJson(text) ?? decodePortableState(text));
		};
		// Chrome fires no event on a cancelled picker; `cancel` covers the browsers that do.
		input.addEventListener("cancel", () => resolve(null));
		input.click();
	});
}
