/**
 * Re-open: turn a retained export snapshot back into studio model state.
 *
 * Provenance stores the full `ExportSnapshot` alongside each export, so "re-open" can restore
 * the exact setup that produced a frame. This helper merges the snapshot's pixel-determining
 * fields OVER the current model (preserving fields the snapshot doesn't carry — artwork,
 * track numbers, playback transport) and hands back a complete `IpodWorkbenchModel` ready to
 * dispatch through `RESTORE_MODEL`.
 *
 * It is pure (no React, no dispatch) so a test can assert the round-trip: a model rebuilt from
 * a snapshot re-derives the SAME fingerprint as the original export.
 */

import type { StudioLightingConfig } from "@/lib/studio-lighting-config";
import type { IpodOsScreen, IpodWorkbenchModel } from "@/lib/ipod-state/model";

import { sanitizeMotionState, withoutTransport } from "@/lib/motion/motion-state";

import type { ExportSnapshot } from "./export-fingerprint";

export function snapshotToModel(
	current: IpodWorkbenchModel,
	snapshot: ExportSnapshot,
): IpodWorkbenchModel {
	return {
		...current,
		metadata: {
			...current.metadata,
			title: snapshot.metadata.title,
			artist: snapshot.metadata.artist,
			album: snapshot.metadata.album,
			currentTime: snapshot.metadata.currentTime,
			duration: snapshot.metadata.duration,
		},
		presentation: {
			...current.presentation,
			skinColor: snapshot.presentation.skinColor,
			bgColor: snapshot.presentation.bgColor,
			ringColor: snapshot.presentation.ringColor,
			centerColor: snapshot.presentation.centerColor,
			backColor: snapshot.presentation.backColor,
			edgeColor: snapshot.presentation.edgeColor,
			bezelColor: snapshot.presentation.bezelColor,
			// hardwarePreset is a string union upstream; the snapshot widens it to string.
			hardwarePreset: snapshot.presentation
				.hardwarePreset as IpodWorkbenchModel["presentation"]["hardwarePreset"],
		},
		interaction: {
			...current.interaction,
			batteryLevel: snapshot.batteryLevel,
			osScreen: snapshot.osScreen as IpodOsScreen,
		},
		studio: {
			...current.studio,
			marquee: snapshot.marquee,
			lighting: snapshot.lighting as StudioLightingConfig,
			// Motion restores through its own sanitizer, which is ALSO the migration: a v1
			// record carries `move`/`loop`/`speed`/`durationSec` at the top level and a v2
			// one carries a `motion` identity, and both heal to the authored shape here
			// rather than at each call site. The playhead is not restored — a re-opened
			// setup opens composed, the same rule every other boundary keeps.
			motion: withoutTransport(
				sanitizeMotionState((snapshot as { motion?: unknown }).motion ?? snapshot),
			),
		},
	};
}
