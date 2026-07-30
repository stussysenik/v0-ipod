"use client";

import { useEffect, useState } from "react";

/**
 * One cached blob, as a `src`.
 *
 * An object URL is a manual allocation: minted per blob, revoked when the blob changes or the
 * reader unmounts. Three readers of the proof cache needed the same four lines — the history
 * thumbnail, the timeline strip's cells, and any future one — and a leak here is invisible
 * until a long session runs the tab out of memory, which is exactly the class of bug that
 * should have one implementation rather than three.
 *
 * `null` while there is no blob, so a reader can branch on it directly.
 *
 * Not for the proof panel: that one deliberately KEEPS the last frame it showed while the next
 * is computing, which is a different lifetime (two blobs alive, one displayed dimmed) and its
 * own contract.
 */
export function useBlobUrl(blob: Blob | null | undefined): string | null {
	const [url, setUrl] = useState<string | null>(null);
	useEffect(() => {
		if (!blob) {
			setUrl(null);
			return;
		}
		const next = URL.createObjectURL(blob);
		setUrl(next);
		return () => URL.revokeObjectURL(next);
	}, [blob]);
	return url;
}
