"use client";

import { Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { PanelFrame } from "@ipod/lib/ipod-state/model";
import { clampFrameToViewport } from "@ipod/lib/ipod-state/panel-layout";
import type { PanelSpec } from "./panel-registry";

type GestureDir = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface Gesture {
	dir: GestureDir;
	pointerX: number;
	pointerY: number;
	start: PanelFrame;
	vw: number;
	vh: number;
}

/** The 8 resize affordances. Each edits one or both axes from the corresponding edge. */
const RESIZE_HANDLES: { dir: Exclude<GestureDir, "move">; className: string }[] = [
	{ dir: "n", className: "left-2 right-2 top-0 h-1.5 cursor-ns-resize" },
	{ dir: "s", className: "left-2 right-2 bottom-0 h-1.5 cursor-ns-resize" },
	{ dir: "w", className: "top-2 bottom-2 left-0 w-1.5 cursor-ew-resize" },
	{ dir: "e", className: "top-2 bottom-2 right-0 w-1.5 cursor-ew-resize" },
	{ dir: "nw", className: "left-0 top-0 h-3 w-3 cursor-nwse-resize" },
	{ dir: "ne", className: "right-0 top-0 h-3 w-3 cursor-nesw-resize" },
	{ dir: "sw", className: "left-0 bottom-0 h-3 w-3 cursor-nesw-resize" },
	{ dir: "se", className: "right-0 bottom-0 h-3 w-3 cursor-nwse-resize" },
];

export interface FloatingPanelProps {
	spec: PanelSpec;
	/** The resolved, viewport-clamped frame from the store. */
	frame: PanelFrame;
	onCommitFrame: (patch: Partial<PanelFrame>) => void;
	onFocus: () => void;
	onToggleCollapsed: () => void;
	onClose: () => void;
}

/**
 * One draggable / resizable / collapsible floating tool window (spec: floating-panel-system).
 *
 * Interaction is hand-rolled with pointer capture — consistent with the codebase's other
 * custom drag surfaces (OrbitRig, now-playing layout) and avoiding a dep. The gesture runs
 * on transient local state for smoothness; the store is written ONCE on pointer-up, matching
 * the export-determinism posture (no machine event per frame).
 */
export function FloatingPanel({
	spec,
	frame,
	onCommitFrame,
	onFocus,
	onToggleCollapsed,
	onClose,
}: FloatingPanelProps) {
	// Live frame drives the DOM while a gesture is in flight; otherwise it mirrors the store.
	const [live, setLive] = useState<PanelFrame>(frame);
	const gesture = useRef<Gesture | null>(null);
	const rafRef = useRef<number | null>(null);
	const pendingRef = useRef<PanelFrame | null>(null);

	// Re-sync from the store whenever it changes and we're not mid-gesture (reset, restore,
	// reclamp on window resize all flow through here).
	useEffect(() => {
		if (!gesture.current) setLive(frame);
	}, [frame]);

	const { collapsed } = live;
	const displayW = collapsed ? spec.idealMinSize.w : live.w;
	const displayH = collapsed ? spec.idealMinSize.h : live.h;

	const applyGesture = useCallback(
		(clientX: number, clientY: number) => {
			const g = gesture.current;
			if (!g) return;
			const dx = clientX - g.pointerX;
			const dy = clientY - g.pointerY;
			let { x, y, w, h } = g.start;

			if (g.dir === "move") {
				x = g.start.x + dx;
				y = g.start.y + dy;
			} else {
				const minW = spec.minSize.w;
				const minH = spec.minSize.h;
				if (g.dir.includes("e")) w = Math.max(minW, g.start.w + dx);
				if (g.dir.includes("s")) h = Math.max(minH, g.start.h + dy);
				if (g.dir.includes("w")) {
					w = Math.max(minW, g.start.w - dx);
					x = g.start.x + (g.start.w - w);
				}
				if (g.dir.includes("n")) {
					h = Math.max(minH, g.start.h - dy);
					y = g.start.y + (g.start.h - h);
				}
			}

			const next = clampFrameToViewport({ ...g.start, x, y, w, h }, g.vw, g.vh);
			pendingRef.current = next;
			if (rafRef.current === null) {
				rafRef.current = requestAnimationFrame(() => {
					rafRef.current = null;
					if (pendingRef.current) setLive(pendingRef.current);
				});
			}
		},
		[spec.minSize.w, spec.minSize.h],
	);

	const endGesture = useCallback(() => {
		const g = gesture.current;
		gesture.current = null;
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		const final = pendingRef.current;
		pendingRef.current = null;
		window.removeEventListener("pointermove", onPointerMove);
		window.removeEventListener("pointerup", endGesture);
		// Commit the move/resize once. Collapsed panels only ever move (w/h preserved).
		if (g && final) {
			onCommitFrame(
				g.dir === "move"
					? { x: final.x, y: final.y }
					: { x: final.x, y: final.y, w: final.w, h: final.h },
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [onCommitFrame]);

	const onPointerMove = useCallback(
		(e: PointerEvent) => applyGesture(e.clientX, e.clientY),
		[applyGesture],
	);

	const beginGesture = useCallback(
		(dir: GestureDir, e: React.PointerEvent) => {
			e.preventDefault();
			onFocus();
			gesture.current = {
				dir,
				pointerX: e.clientX,
				pointerY: e.clientY,
				start: { ...live },
				vw: window.innerWidth,
				vh: window.innerHeight,
			};
			pendingRef.current = { ...live };
			window.addEventListener("pointermove", onPointerMove);
			window.addEventListener("pointerup", endGesture);
		},
		[live, onFocus, onPointerMove, endGesture],
	);

	useEffect(
		() => () => {
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", endGesture);
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
		},
		[onPointerMove, endGesture],
	);

	return (
		<div
			role="dialog"
			aria-label={spec.title}
			className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-xl border border-[#D0D4DA] bg-[#F2F2F0]/95 shadow-[0_18px_44px_rgba(0,0,0,0.22)] backdrop-blur-md"
			style={{ left: live.x, top: live.y, width: displayW, height: displayH, zIndex: 100 + live.z }}
			onPointerDownCapture={onFocus}
			data-panel-id={spec.id}
		>
			{/* Title bar = the sole drag handle. Body controls never start a drag. */}
			<div
				className="flex h-9 shrink-0 cursor-grab items-center justify-between gap-2 border-b border-black/10 bg-[#E7E7E3]/80 px-2.5 active:cursor-grabbing"
				style={{ touchAction: "none" }}
				onPointerDown={(e) => beginGesture("move", e)}
				data-panel-titlebar
			>
				<span className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-black/65">
					{spec.title}
				</span>
				<div className="flex items-center gap-0.5">
					<button
						type="button"
						aria-label={collapsed ? `Expand ${spec.title}` : `Collapse ${spec.title}`}
						className="grid h-6 w-6 place-items-center rounded-md text-black/50 hover:bg-black/5 hover:text-black/80"
						onPointerDown={(e) => e.stopPropagation()}
						onClick={onToggleCollapsed}
						data-panel-collapse
					>
						{collapsed ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
					</button>
					<button
						type="button"
						aria-label={`Close ${spec.title}`}
						className="grid h-6 w-6 place-items-center rounded-md text-black/50 hover:bg-black/5 hover:text-black/80"
						onPointerDown={(e) => e.stopPropagation()}
						onClick={onClose}
						data-panel-close
					>
						<X className="h-3.5 w-3.5" />
					</button>
				</div>
			</div>

			{!collapsed && (
				<div className="min-h-0 flex-1 overflow-auto overscroll-contain p-3">
					{spec.content}
				</div>
			)}

			{!collapsed &&
				RESIZE_HANDLES.map((handle) => (
					<div
						key={handle.dir}
						className={`absolute ${handle.className}`}
						style={{ touchAction: "none" }}
						onPointerDown={(e) => beginGesture(handle.dir, e)}
						data-panel-resize={handle.dir}
					/>
				))}
		</div>
	);
}
