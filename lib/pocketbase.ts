import PocketBase from "pocketbase";

import type { ExportSnapshot } from "@/lib/export/export-fingerprint";

/**
 * PocketBase client for persisting export history.
 * Set NEXT_PUBLIC_POCKETBASE_URL to enable it; unset, the feature is off.
 *
 * The localhost default is a *development* convenience and must never ship. On a
 * deployed page it does not point at a server we run — it points at port 8090 on the
 * **visitor's own machine**, so every load fired a request at their laptop and logged
 * `ERR_CONNECTION_REFUSED` in their console. Unconfigured in production therefore means
 * the feature is disabled, not aimed somewhere harmless-looking.
 */
const configuredUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL?.trim();
const localFallback =
	process.env.NODE_ENV === "production" ? undefined : "http://127.0.0.1:8090";
const pbUrl = configuredUrl || localFallback;

/** False when no PocketBase is configured — the history calls below then no-op. */
export const isExportHistoryEnabled = Boolean(pbUrl);

// `pb` stays constructed either way so `getExportVideoUrl` keeps its type; it is simply
// never asked to reach the network while disabled.
export const pb = new PocketBase(pbUrl ?? "http://127.0.0.1:8090");

export interface ExportRecord {
	id: string;
	created: string;
	collectionId: string;
	collectionName: string;
	title: string;
	move: string;
	aspect: string;
	duration: number;
	video: string; // Filename in PB storage
	thumbnail?: string;
	/**
	 * Provenance (additive — legacy records omit these and degrade to no thumbnail / no
	 * re-open). `fingerprint` is the `exportFingerprint` identity; `snapshot` is the retained
	 * input set that re-opens the exact setup and keys the proof thumbnail in the shared cache.
	 */
	fingerprint?: string;
	snapshot?: ExportSnapshot;
}

/**
 * Upload an exported video blob to PocketBase.
 */
export async function saveExportToHistory(
	videoBlob: Blob,
	filename: string,
	metadata: {
		title: string;
		move: string;
		aspect: string;
		duration: number;
		/** Provenance stamp — the export identity + retained snapshot (optional/additive). */
		fingerprint?: string;
		snapshot?: ExportSnapshot;
	}
): Promise<ExportRecord | null> {
	if (!isExportHistoryEnabled) return null;
	try {
		const formData = new FormData();
		formData.append("video", videoBlob, filename);
		formData.append("title", metadata.title);
		formData.append("move", metadata.move);
		formData.append("aspect", metadata.aspect);
		formData.append("duration", metadata.duration.toString());
		// Provenance: stored as fields if the collection has them; unknown fields are ignored
		// by PB, and we re-attach them locally regardless so re-open works this session.
		if (metadata.fingerprint) formData.append("fingerprint", metadata.fingerprint);
		if (metadata.snapshot) formData.append("snapshot", JSON.stringify(metadata.snapshot));

		// collection 'exports' must exist in PB
		const record = await pb.collection("exports").create(formData);
		return record as unknown as ExportRecord;
	} catch (error) {
		console.warn("[pocketbase] failed to save export history:", error);
		// Local fallback for offline mode — could use IndexedDB here if needed.
		return null;
	}
}

/**
 * Fetch the latest export history.
 */
export async function getExportHistory(limit = 10): Promise<ExportRecord[]> {
	if (!isExportHistoryEnabled) return [];
	try {
		const records = await pb.collection("exports").getList(1, limit, {
			sort: "-created",
		});
		return records.items as unknown as ExportRecord[];
	} catch (error) {
		console.warn("[pocketbase] failed to fetch export history:", error);
		return [];
	}
}

/**
 * Get the public URL for a video file.
 */
export function getExportVideoUrl(record: ExportRecord): string {
	return pb.files.getURL(record, record.video);
}
