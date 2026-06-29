"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type Dispatch } from "react";

import { StudioControlScope } from "@/components/ui/studio-controls";
import type { IpodCameraFocus, ThreeDIpodHandle } from "@/components/three/three-d-ipod";
import type { IpodPresentationState } from "@/lib/ipod-state/model";
import type { IpodWorkbenchAction } from "@/lib/ipod-state/update";
import type { StudioPose } from "@/lib/studio-camera";

/**
 * The /3d bottom bar — one strip that owns *orientation* and *saved studio shots*.
 *
 *   • Orientation — the Product / Front / Back snaps (the camera focus), lifted out
 *     of the canvas so the saved-shot chips can sit right beside them.
 *   • Studio shots — a "quick variable" that bundles the composed camera pose AND
 *     the product look (case / wheel / center / back / bezel / stage colors) into one
 *     recallable chip. Tap a chip to fly the camera back to that pose *and* repaint
 *     the body to that finish in a single gesture; right-click / long-press to drop it.
 *
 * A camera pose alone is the existing cockpit "Save pose"; a studio shot is the
 * whole hero — angle + finish — so you can flip between fully-composed looks the way
 * a phone camera flips between saved filters.
 */

const SHOTS_STORAGE_KEY = "ipod-3d-studio-shots";

// The slice of presentation a studio shot restores — the body finish, not the
// hardware preset or view mode (orientation is carried by the pose).
interface ShotLook {
	skinColor: string;
	ringColor: string;
	centerColor: string;
	backColor: string;
	edgeColor: string;
	bezelColor: string;
	bgColor: string;
}

interface StudioShot {
	id: string;
	pose: StudioPose;
	look: ShotLook;
}

const FOCI: readonly { id: IpodCameraFocus; label: string }[] = [
	{ id: "product", label: "Product" },
	{ id: "front", label: "Front" },
	{ id: "back", label: "Back" },
] as const;

interface Ipod3DStudioShotsProps {
	apiRef: React.MutableRefObject<ThreeDIpodHandle | null>;
	focus: IpodCameraFocus;
	onFocus: (focus: IpodCameraFocus) => void;
	presentation: IpodPresentationState;
	dispatch: Dispatch<IpodWorkbenchAction>;
	onNotice?: (message: string) => void;
	/** Short-landscape phones: dock bottom-left (the touch controls take bottom-right)
	 *  so neither strip overlaps the centered model. */
	landscape?: boolean;
}

export function Ipod3DStudioShots({
	apiRef,
	focus,
	onFocus,
	presentation,
	dispatch,
	onNotice,
	landscape = false,
}: Ipod3DStudioShotsProps) {
	const [shots, setShots] = useState<StudioShot[]>([]);
	const counter = useRef(1);

	// Hydrate saved shots once.
	useEffect(() => {
		try {
			const raw = localStorage.getItem(SHOTS_STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as StudioShot[];
				setShots(parsed);
				counter.current = parsed.length + 1;
			}
		} catch {
			// ignore malformed storage
		}
	}, []);

	const persist = useCallback((next: StudioShot[]) => {
		setShots(next);
		try {
			localStorage.setItem(SHOTS_STORAGE_KEY, JSON.stringify(next));
		} catch {
			// ignore quota / private-mode failures
		}
	}, []);

	const saveShot = useCallback(() => {
		const pose = apiRef.current?.getCameraPose();
		if (!pose) return;
		const look: ShotLook = {
			skinColor: presentation.skinColor,
			ringColor: presentation.ringColor,
			centerColor: presentation.centerColor,
			backColor: presentation.backColor,
			edgeColor: presentation.edgeColor,
			bezelColor: presentation.bezelColor,
			bgColor: presentation.bgColor,
		};
		persist([...shots, { id: `S${counter.current++}`, pose, look }]);
		onNotice?.("Studio shot saved");
	}, [apiRef, persist, presentation, shots, onNotice]);

	const recallShot = useCallback(
		(shot: StudioShot) => {
			// Repaint the body, then fly the camera. Colors are React state; the pose
			// eases through the orbit rig — both land together as one composed look.
			dispatch({ type: "SET_SKIN_COLOR", payload: shot.look.skinColor });
			dispatch({ type: "SET_RING_COLOR", payload: shot.look.ringColor });
			dispatch({ type: "SET_CENTER_COLOR", payload: shot.look.centerColor });
			dispatch({ type: "SET_BACK_COLOR", payload: shot.look.backColor });
			// Legacy shots predate the edge zone — fall back to back so they recall unchanged.
			dispatch({ type: "SET_EDGE_COLOR", payload: shot.look.edgeColor ?? shot.look.backColor });
			dispatch({ type: "SET_BEZEL_COLOR", payload: shot.look.bezelColor });
			dispatch({ type: "SET_BG_COLOR", payload: shot.look.bgColor });
			apiRef.current?.setCameraGoal({
				azimuth: shot.pose.azimuth,
				elevation: shot.pose.elevation,
				reach: shot.pose.reach,
			});
		},
		[apiRef, dispatch],
	);

	const removeShot = useCallback(
		(id: string) => persist(shots.filter((s) => s.id !== id)),
		[persist, shots],
	);

	// The bar is solved against the active stage: it floats over a user-colored stage, so
	// its surface/label/accent are derived for guaranteed contrast on any stage color.
	const surfaceStyle: CSSProperties = {
		background: "var(--studio-surface)",
		borderColor: "var(--studio-hairline)",
	};

	return (
		<StudioControlScope
			stageBackground={presentation.bgColor}
			style={surfaceStyle}
			className={`pointer-events-auto fixed z-30 flex items-center gap-1 rounded-full border p-1 shadow-sm backdrop-blur-md ${
				landscape
					? "bottom-3 left-3 max-w-[58vw]"
					: "bottom-6 left-1/2 max-w-[calc(100vw-1.5rem)] -translate-x-1/2"
			}`}
		>
			{/* Orientation — the Product / Front / Back snaps. Active = solved solid fill. */}
			{FOCI.map((f) => {
				const active = focus === f.id;
				return (
					<button
						key={f.id}
						type="button"
						onClick={() => onFocus(f.id)}
						className="rounded-full px-3 py-1 text-[11px] font-semibold tracking-tight outline-none transition-all duration-200"
						style={{
							background: active ? "var(--studio-selected-fill)" : "transparent",
							color: active ? "var(--studio-selected-label)" : "var(--studio-label)",
							opacity: active ? 1 : 0.6,
						}}
					>
						{f.label}
					</button>
				);
			})}

			<span className="mx-0.5 h-4 w-px shrink-0" style={{ background: "var(--studio-hairline)" }} />

			{/* Saved studio shots — angle + finish bundles */}
			<div className="flex items-center gap-1 overflow-x-auto">
				{shots.map((s) => (
					<button
						key={s.id}
						type="button"
						title={`Recall — az ${s.pose.azimuth.toFixed(0)}° · el ${s.pose.elevation.toFixed(0)}° · ${s.look.skinColor}  (right-click to remove)`}
						onClick={() => recallShot(s)}
						onContextMenu={(e) => {
							e.preventDefault();
							removeShot(s.id);
						}}
						className="flex shrink-0 items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-2.5 font-mono text-[10px] outline-none transition-all duration-200"
						style={{ borderColor: "var(--studio-hairline)", color: "var(--studio-label)", opacity: 0.7 }}
					>
						<span
							className="h-2.5 w-2.5 rounded-full border border-black/15"
							style={{ backgroundColor: s.look.skinColor }}
						/>
						{s.id}
					</button>
				))}
				<button
					type="button"
					onClick={saveShot}
					title="Save the current camera pose + finish as a studio shot"
					className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold outline-none transition-all duration-200"
					style={{ color: "var(--studio-label)", opacity: 0.6 }}
				>
					＋ Shot
				</button>
			</div>
		</StudioControlScope>
	);
}
