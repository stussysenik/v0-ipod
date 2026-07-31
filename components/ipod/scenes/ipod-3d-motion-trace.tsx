"use client";

import { useMemo } from "react";

import type { MotionDoc } from "@/lib/motion/doc";
import { motionTrace, type TracePoint } from "@/lib/motion/trace";

/**
 * THE MOTION TRACE — the shape a document draws, so a picker can state a value.
 *
 * The algebra is `lib/motion/trace.ts` and is proven there; this file is the projection onto
 * an SVG and nothing else. Everything drawn is derived from the document the rig flies, so
 * the picture cannot claim a motion the export would not render.
 *
 * INERT AND `aria-hidden`. It carries no information the host row does not already state in
 * text — the name, the cycle length, the per-axis amplitudes are all words elsewhere. A
 * picture that duplicates them owes the screen reader nothing.
 *
 * THE UNIT VIEWBOX WITH A NON-SCALING STROKE is what lets one component serve a 36px card and
 * a 16px row. Points arrive in `[0,1]`; `preserveAspectRatio="none"` stretches them to
 * whatever box the host gives, and `vectorEffect` keeps the hairline at 1px through the
 * stretch instead of smearing it into an ellipse.
 *
 * TRACK ORDER IS THE ONLY ENCODING. Monochrome carries the interface, so lines separate by
 * opacity in `orderedTrackKeys` order — the same order the Tracks rows list, so the eye maps
 * between the picture and the list without a legend.
 */

const LABEL = "var(--studio-label)";
const ACCENT = "var(--studio-accent)";

/** Inset so a stroke centred on the frame edge is not sliced in half by the viewport. */
const PAD_Y = 0.09;
const PAD_X = 0.02;

/** Opacity per line, by track order. Beyond the third, every further axis reads as the last. */
const LINE_OPACITY = [1, 0.55, 0.3] as const;

const projectX = (x: number) => PAD_X + x * (1 - 2 * PAD_X);
/** SVG y grows downward; a value of 1 belongs at the top. */
const projectY = (y: number) => 1 - PAD_Y - y * (1 - 2 * PAD_Y);

function pathOf(points: readonly TracePoint[]): string {
	return points
		.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${projectX(x).toFixed(4)} ${projectY(y).toFixed(4)}`)
		.join(" ");
}

export interface Ipod3DMotionTraceProps {
	doc: MotionDoc;
	/**
	 * Cycle phase to mark, or `null` for no mark. Only the document actually flying passes a
	 * number: a playhead drawn on a move that is not running is a readout of someone else's
	 * clock.
	 */
	playhead?: number | null;
	/** Rendered height in pixels. Width always fills the host. */
	height?: number;
}

export function Ipod3DMotionTrace({ doc, playhead = null, height = 36 }: Ipod3DMotionTraceProps) {
	// Pure in `doc`, so identity is a sufficient dependency and 48 samples is a sub-millisecond
	// recompute when it changes. No hash needed to make this cheap.
	const trace = useMemo(() => motionTrace(doc), [doc]);
	const mark = playhead === null ? null : projectX(Math.min(Math.max(playhead, 0), 1));

	return (
		<svg
			viewBox="0 0 1 1"
			preserveAspectRatio="none"
			width="100%"
			height={height}
			className="block"
			aria-hidden
		>
			{trace.lines.map((line, i) => (
				<path
					key={line.key}
					d={pathOf(line.points)}
					fill="none"
					stroke={LABEL}
					strokeWidth={1}
					strokeLinecap="round"
					strokeLinejoin="round"
					vectorEffect="non-scaling-stroke"
					// A flat line is an axis contributing nothing; dashing says so without a word.
					strokeDasharray={line.flat ? "2 3" : undefined}
					opacity={(LINE_OPACITY[i] ?? LINE_OPACITY[LINE_OPACITY.length - 1]) * (line.flat ? 0.5 : 1)}
				/>
			))}
			{mark !== null && (
				<line
					x1={mark}
					y1={0}
					x2={mark}
					y2={1}
					stroke={ACCENT}
					strokeWidth={1}
					vectorEffect="non-scaling-stroke"
				/>
			)}
		</svg>
	);
}
