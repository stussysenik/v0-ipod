import { CAMERA_MOVES, MOVE_CYCLE_SECONDS } from "./studio-camera";
import type { StudioClip } from "./studio-clip";
import { MOTION_PRESETS } from "./theatre/motion-presets";

export * from "./studio-clip";

/**
 * The full studio motion catalogue: the procedural moves and the Theatre.js
 * moment cards, presented as one flat list of `StudioClip`s for the cockpit
 * picker and the export pipeline. Procedural clips come first (they are the
 * battle-tested defaults); moment cards extend the vocabulary.
 */

const PROCEDURAL_CLIPS: StudioClip[] = CAMERA_MOVES.map((move) => ({
	kind: "procedural",
	id: move.id,
	label: move.label,
	hint: move.hint,
	move: move.id,
	naturalCycleSeconds: MOVE_CYCLE_SECONDS[move.id],
	loopable: true,
}));

const THEATRE_CLIPS: StudioClip[] = MOTION_PRESETS.map((preset) => ({
	kind: "theatre",
	id: preset.id,
	label: preset.label,
	hint: preset.hint,
	preset,
	naturalCycleSeconds: preset.naturalCycleSeconds,
	loopable: preset.loopable,
}));

export const STUDIO_CLIPS: readonly StudioClip[] = [...PROCEDURAL_CLIPS, ...THEATRE_CLIPS];

export function findStudioClip(id: string): StudioClip | undefined {
	return STUDIO_CLIPS.find((clip) => clip.id === id);
}
