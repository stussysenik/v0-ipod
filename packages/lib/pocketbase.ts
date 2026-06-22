import PocketBase from "pocketbase";

import type { ExportSnapshot } from "@ipod/lib/export/export-fingerprint";

/**
 * PocketBase client for persisting export history.
 * Defaults to a local instance; override with NEXT_PUBLIC_POCKETBASE_URL.
 */
const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
export const pb = new PocketBase(pbUrl);

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
