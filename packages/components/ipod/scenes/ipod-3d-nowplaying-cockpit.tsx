"use client";

import { useEffect, useState, type Dispatch } from "react";

import { IpodStarRating } from "@ipod/components/ipod/controls/ipod-star-rating";
import { EditableTrackNumber } from "@ipod/components/ipod/editors/editable-track-number";
import { ImageUpload } from "@ipod/components/ipod/editors/image-upload";
import type { IpodWorkbenchAction } from "@ipod/lib/ipod-state/update";
import type { SongMetadata } from "@ipod/types/ipod";

import { Ipod3DCockpitHeader } from "./ipod-3d-cockpit-header";

/**
 * The Now-Playing cockpit for the /3d stage — edit the track that's baked into
 * every export (song title, artist, album, album cover, rating, track number).
 *
 * Design language matches the color cockpit: one white card, a single hairline,
 * black type, thin rows. It dispatches the SAME reducer actions the 2D workbench
 * uses (UPDATE_TITLE/ARTIST/ALBUM/ARTWORK/RATING/TRACK_NUMBER/TOTAL_TRACKS), so
 * the 3D screen and the 2D authoring surface stay one source of truth — and the
 * controls are the reliable, mobile-friendly path alongside inline-on-screen
 * editing. Reuses the workbench editors (ImageUpload, IpodStarRating,
 * EditableTrackNumber) rather than re-implementing them.
 */

interface Ipod3DNowPlayingCockpitProps {
	/** Position in the control surface, rendered as the header's number chip. */
	index: number;
	metadata: SongMetadata;
	dispatch: Dispatch<IpodWorkbenchAction>;
}

export function Ipod3DNowPlayingCockpit({ index, metadata, dispatch }: Ipod3DNowPlayingCockpitProps) {
	return (
		<div className="pointer-events-auto w-full select-none rounded-[16px] border border-black/[0.09] bg-white/95 backdrop-blur-sm">
			<Ipod3DCockpitHeader index={index} title="Now Playing" />
			<div className="border-b border-black/[0.06] px-4 pb-4 pt-3">
				<div className="flex gap-3">
					{/* Album cover — tap to upload */}
					<div className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-lg border border-black/10">
						<ImageUpload
							currentImage={metadata.artwork}
							onImageChange={(image) => dispatch({ type: "UPDATE_ARTWORK", payload: image })}
							className="h-full w-full"
						/>
					</div>
					{/* Title / Artist / Album */}
					<div className="flex min-w-0 flex-1 flex-col gap-1.5">
						<Field
							value={metadata.title}
							placeholder="Song title"
							bold
							onChange={(v) => dispatch({ type: "UPDATE_TITLE", payload: v })}
						/>
						<Field
							value={metadata.artist}
							placeholder="Artist"
							onChange={(v) => dispatch({ type: "UPDATE_ARTIST", payload: v })}
						/>
						<Field
							value={metadata.album}
							placeholder="Album"
							onChange={(v) => dispatch({ type: "UPDATE_ALBUM", payload: v })}
						/>
					</div>
				</div>
			</div>

			{/* Rating + track number */}
			<div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3.5">
				<div className="flex items-center gap-2.5">
					<Label>Rating</Label>
					<IpodStarRating
						rating={metadata.rating}
						onChange={(rating) => dispatch({ type: "UPDATE_RATING", payload: rating })}
						fontSize={18}
					/>
				</div>
				<div className="flex items-center gap-2.5">
					<Label>Track</Label>
					<EditableTrackNumber
						trackNumber={metadata.trackNumber}
						totalTracks={metadata.totalTracks}
						onTrackNumberChange={(v) => dispatch({ type: "UPDATE_TRACK_NUMBER", payload: v })}
						onTotalTracksChange={(v) => dispatch({ type: "UPDATE_TOTAL_TRACKS", payload: v })}
						className="text-[13px] font-medium text-black/70"
					/>
				</div>
			</div>

			{/* Start (elapsed) + End (track length) — the two numbers flanking the
			    progress bar. End clamps to ≥ Start so the remaining time stays valid. */}
			<div className="flex items-center justify-between px-4 py-3.5">
				<div className="flex items-center gap-2.5">
					<Label>Start</Label>
					<TimeField
						seconds={metadata.currentTime}
						onCommit={(secs) =>
							dispatch({
								type: "UPDATE_CURRENT_TIME",
								payload: Math.min(secs, metadata.duration),
							})
						}
					/>
				</div>
				<div className="flex items-center gap-2.5">
					<Label>End</Label>
					<TimeField
						seconds={metadata.duration}
						onCommit={(secs) =>
							dispatch({
								type: "UPDATE_DURATION",
								payload: Math.max(secs, metadata.currentTime),
							})
						}
					/>
				</div>
			</div>
		</div>
	);
}

/** mm:ss time input — commits on blur/Enter, reverts on invalid. */
function TimeField({
	seconds,
	onCommit,
}: {
	seconds: number;
	onCommit: (seconds: number) => void;
}) {
	const [draft, setDraft] = useState(() => formatTime(seconds));

	// Re-sync when the upstream value changes (e.g. clamp or another control).
	useEffect(() => {
		setDraft(formatTime(seconds));
	}, [seconds]);

	// Read the live input value (not the React draft state) so a commit triggered in
	// the same tick as the last keystroke can't read a stale closure.
	const commit = (raw: string) => {
		const parsed = parseTime(raw);
		if (parsed === null) {
			setDraft(formatTime(seconds));
			return;
		}
		onCommit(parsed);
		setDraft(formatTime(parsed));
	};

	return (
		<input
			type="text"
			inputMode="numeric"
			value={draft}
			onChange={(e) => setDraft(e.target.value)}
			onBlur={(e) => commit(e.target.value)}
			onKeyDown={(e) => {
				if (e.key === "Enter") e.currentTarget.blur();
				if (e.key === "Escape") setDraft(formatTime(seconds));
			}}
			className="w-[64px] rounded-[8px] border border-transparent bg-black/[0.03] px-2 py-2 text-center font-mono text-[13px] tabular-nums text-black/70 outline-none transition-colors hover:border-black/10 focus:border-black/20 focus:bg-white"
		/>
	);
}

/** Seconds → "m:ss". */
function formatTime(totalSeconds: number): string {
	const s = Math.max(0, Math.floor(totalSeconds));
	const m = Math.floor(s / 60);
	return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** "m:ss" or a bare seconds count → seconds, or null when unparseable. */
function parseTime(value: string): number | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (trimmed.includes(":")) {
		const [m, s] = trimmed.split(":");
		const mins = Number(m);
		const secs = Number(s);
		if (!Number.isFinite(mins) || !Number.isFinite(secs) || secs >= 60 || secs < 0) return null;
		return Math.max(0, Math.round(mins * 60 + secs));
	}
	const bare = Number(trimmed);
	return Number.isFinite(bare) ? Math.max(0, Math.round(bare)) : null;
}

/** One hairline text field — black type, no chrome, focus ring only. */
function Field({
	value,
	placeholder,
	onChange,
	bold = false,
}: {
	value: string;
	placeholder: string;
	onChange: (value: string) => void;
	bold?: boolean;
}) {
	return (
		<input
			type="text"
			value={value}
			placeholder={placeholder}
			onChange={(e) => onChange(e.target.value)}
			className={`w-full rounded-[8px] border border-transparent bg-black/[0.03] px-2.5 py-2 text-[13px] text-black/80 outline-none transition-colors placeholder:text-black/25 hover:border-black/10 focus:border-black/20 focus:bg-white ${
				bold ? "font-semibold" : "font-medium"
			}`}
		/>
	);
}

function Label({ children }: { children: React.ReactNode }) {
	return (
		<span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/35">
			{children}
		</span>
	);
}
