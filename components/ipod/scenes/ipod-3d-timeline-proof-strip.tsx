"use client";

import { StudioField, StudioLabel, CONTROL_RADIUS } from "@/components/ui/studio-controls";
import type { ProofEntry } from "@/lib/export/proof-cache";
import { timelineStripCells } from "@/lib/export/timeline-strip";
import type { TimelineProofFrame } from "@/lib/export/timeline-proof";
import { useBlobUrl } from "@/lib/export/use-blob-url";

/**
 * THE TIMELINE PROOF STRIP — the frames the export will render, under the scrubber that flies
 * them.
 *
 * The set has been planned, walked and cached every idle tick since §5.5; until this file it
 * warmed a cache nobody looked at. The strip is a PURE READER of that cache, like the proof
 * panel: it never triggers a render, so browsing the catalogue costs nothing here and a cell
 * fills in when the background queue reaches it.
 *
 * WHAT MAKES A CELL A PROOF RATHER THAN A THUMBNAIL: the frame was rendered from the pose the
 * export renders at that position, through the same sampler and the same transport
 * (`planTimelineProof`). The label states the clip time it proves, so the claim is checkable
 * against the transport readout directly above it rather than taken on trust.
 *
 * IT IS A CONTROL, NOT A PICTURE. A cell scrubs the playhead to the position it proves — the
 * one gesture that makes the strip and the scrubber the same axis, and the reason it needs no
 * offset arithmetic to be "aligned": it hangs full-width beneath a full-width scrubber and
 * each cell carries its own time.
 *
 * A MISS IS A FRAME COMPUTING, NEVER A FRAME ABSENT. The row stays, the label stays, the frame
 * box pulses. An empty state with a sentence in it would be the one thing this surface must
 * not be: the set is either not planned yet (nothing renders at all) or it is five cells.
 *
 * IT READS THE CACHE DURING RENDER AND TAKES NO `version` PROP. A landed frame reaches the
 * strip through the stage's own re-render — the hook's `version` is state up there — and `peek`
 * is non-bumping, so five lookups per render cost nothing. The consequence is a constraint:
 * this component must NOT be wrapped in `React.memo`, because its output depends on cache
 * contents that no prop describes.
 *
 * Tokens are read as bare `var(--studio-*)`: this panel is composed inside the motion
 * inspector's own `StudioControlScope`, which emits them one element up.
 */

const LABEL = "var(--studio-label)";
const HAIRLINE = "var(--studio-hairline)";
const SURFACE = "var(--studio-surface)";
const ACCENT = "var(--studio-accent)";

export interface Ipod3DTimelineProofStripProps {
	/** The planned set — key, position and pose per frame, in the document's order. */
	frames: readonly TimelineProofFrame[];
	/** Non-bumping cache read (the hook's `peek`). */
	peek: (fingerprint: string) => ProofEntry | undefined;
	/** Clip length, for each cell's time label. */
	durationSec: number;
	/** Live playhead over the whole clip, `[0,1)`. */
	playhead: number;
	/** Move the playhead to the position a cell proves. */
	onScrub: (t: number) => void;
	disabled?: boolean;
}

export function Ipod3DTimelineProofStrip({
	frames,
	peek,
	durationSec,
	playhead,
	onScrub,
	disabled = false,
}: Ipod3DTimelineProofStripProps) {
	// One cache read per frame per render, deliberately not memoised: a memo would need the
	// hook's `version` as a dep to stay honest, and the dep would be a fake one — nothing in
	// this map is derived from it.
	const blobs = new Map<string, Blob>();
	for (const frame of frames) {
		const blob = peek(frame.key)?.blob;
		if (blob) blobs.set(frame.key, blob);
	}

	const cells = timelineStripCells(frames, {
		durationSec,
		playhead,
		ready: (key) => blobs.has(key),
	});
	if (cells.length === 0) return null;

	const ready = cells.reduce((count, cell) => count + (cell.ready ? 1 : 0), 0);

	return (
		<div className="flex flex-col gap-2">
			<div className="h-px w-full" style={{ background: HAIRLINE }} />
			<div className="flex items-center justify-between gap-2">
				<StudioLabel>Proof</StudioLabel>
				<StudioField>
					{ready}/{cells.length}
				</StudioField>
			</div>
			<div className="flex gap-1">
				{cells.map((cell) => (
					<Cell
						key={cell.key}
						blob={blobs.get(cell.key) ?? null}
						label={cell.label}
						nearest={cell.nearest}
						disabled={disabled}
						onSelect={() => onScrub(cell.position)}
					/>
				))}
			</div>
		</div>
	);
}

/** One proved frame: the image, its clip time, and the scrub that goes there. */
function Cell({
	blob,
	label,
	nearest,
	disabled,
	onSelect,
}: {
	blob: Blob | null;
	label: string;
	nearest: boolean;
	disabled: boolean;
	onSelect: () => void;
}) {
	const url = useBlobUrl(blob);

	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onSelect}
			aria-pressed={nearest}
			aria-label={`Proof at ${label}`}
			className="flex min-w-0 flex-1 flex-col items-center gap-1 outline-none disabled:cursor-not-allowed disabled:opacity-40"
		>
			<span
				className="grid h-14 w-full place-items-center overflow-hidden"
				style={{
					borderRadius: CONTROL_RADIUS,
					background: SURFACE,
					// Colour marks state only: the accent hairline is the one cell the playhead
					// is nearest, which is a claim about now rather than about the frame.
					border: `1px solid ${nearest ? ACCENT : HAIRLINE}`,
				}}
			>
				{url ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={url} alt="" className="h-full w-full object-contain" />
				) : (
					<span
						className="h-1 w-1 animate-pulse rounded-full"
						style={{ background: LABEL, opacity: 0.45 }}
					/>
				)}
			</span>
			<span className="font-mono text-[11px] tabular-nums" style={{ opacity: nearest ? 1 : 0.6 }}>
				{label}
			</span>
		</button>
	);
}
