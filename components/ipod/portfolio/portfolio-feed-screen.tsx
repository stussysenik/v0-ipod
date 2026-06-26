"use client";

import { useEffect, useRef } from "react";

import { IpodDisplay } from "@/components/ipod/display/ipod-display";
import type { NormalizedFeed } from "@/lib/feed/load";
import type { Work } from "@/lib/feed/schema";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import type { NavState } from "@/lib/nav/machine";
import { deriveScreen } from "@/lib/portfolio/feed-screen";

/**
 * Feed-driven portfolio screen — the shared on-device surface.
 *
 * Same visual language as the hand-authored `PortfolioScreen` (the classic OS list,
 * the blue selection, the iPod display frame) but a PURE PROJECTION of the canonical
 * feed via the nav machine — no hardcoded per-screen switch. List screens render the
 * current menu frame; selecting a work opens a scrolling case study built generically
 * from the `Work` record. Both `/portfolio` and `/3d-portfolio` host this node.
 */

const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SELECTED_BG =
	"linear-gradient(180deg, rgba(104,181,242,1) 0%, rgba(49,137,211,1) 100%)";

export function PortfolioFeedScreen({
	preset,
	state,
	model,
}: {
	preset: IpodClassicPresetDefinition;
	state: NavState;
	model: NormalizedFeed;
}) {
	const frameRef = useRef<HTMLDivElement | null>(null);
	const screenTokens = preset.screen;
	const contentHeight = screenTokens.frameHeight - screenTokens.statusBarHeight - 2;

	const screen = deriveScreen(state, model);

	return (
		<IpodDisplay
			preset={preset}
			showOsMenu={screen.isMenu}
			frameRef={frameRef}
			statusBarTitle={screen.title}
			showPlayIndicator={false}
		>
			<div style={{ height: contentHeight, fontFamily: FONT }} className="bg-[#FBFBF9]">
				{screen.isMenu ? (
					<ListView rows={screen.rows} cursor={screen.cursor} height={contentHeight} />
				) : screen.openWork ? (
					<WorkContent
						work={screen.openWork}
						cover={model.resolveCover(screen.openWork)?.src}
						height={contentHeight}
					/>
				) : null}
			</div>
		</IpodDisplay>
	);
}

// ─── List view — classic blue-highlighted scrolling menu ─────────────────────

function ListView({
	rows,
	cursor,
	height,
}: {
	rows: { id: string; label: string; hint: string }[];
	cursor: number;
	height: number;
}) {
	const activeRef = useRef<HTMLDivElement | null>(null);

	// Keep the highlighted row in view as the wheel scrolls.
	useEffect(() => {
		activeRef.current?.scrollIntoView({ block: "nearest" });
	}, [cursor]);

	return (
		<div className="overflow-hidden" style={{ height }}>
			<div className="h-full overflow-y-auto py-[4px]">
				{rows.map((row, index) => {
					const isActive = index === cursor;
					return (
						<div
							key={row.id}
							ref={isActive ? activeRef : undefined}
							className="flex items-center justify-between gap-2 px-[8px] py-[3.5px] text-[10px] font-semibold leading-[1.15]"
							style={{
								color: isActive ? "#FFFFFF" : "#111111",
								background: isActive ? SELECTED_BG : "transparent",
							}}
						>
							<span className="truncate">{row.label}</span>
							{row.hint ? (
								<span
									className="shrink-0 text-[9px] font-medium"
									style={{ color: isActive ? "rgba(255,255,255,0.85)" : "#8A8F98" }}
								>
									{row.hint}
								</span>
							) : null}
						</div>
					);
				})}
			</div>
		</div>
	);
}

// ─── Work case study — generic, feed-driven, scrolling ───────────────────────

function WorkContent({
	work,
	cover,
	height,
}: {
	work: Work;
	cover?: string;
	height: number;
}) {
	const meta = [work.year, work.role, ...work.tags].filter(Boolean).join(" · ");
	// Body is plain markdown/text; render paragraphs split on blank lines so the
	// case study scrolls naturally inside the screen.
	const paragraphs = work.body
		? work.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
		: [];

	return (
		<div
			className="flex h-full flex-col gap-[6px] overflow-y-auto px-[10px] py-[8px] text-[#161616]"
			style={{ height }}
		>
			{cover ? (
				// eslint-disable-next-line @next/next/no-img-element -- feed covers are arbitrary URLs
				<img
					src={cover}
					alt={work.title}
					className="mb-[2px] w-full rounded-[3px] object-cover"
					style={{ maxHeight: Math.round(height * 0.42) }}
				/>
			) : null}
			<div className="text-[11px] font-bold leading-[1.2]">{work.title}</div>
			{meta ? (
				<div className="text-[8px] font-medium uppercase tracking-[0.08em] text-[#8A8F98]">
					{meta}
				</div>
			) : null}
			{work.summary ? (
				<div className="text-[9px] font-semibold leading-[1.35] text-[#3189D3]">
					{work.summary}
				</div>
			) : null}
			{paragraphs.map((p, i) => (
				<div key={i} className="text-[9px] leading-[1.4] text-[#3A3F47]">
					{p}
				</div>
			))}
			{work.links.length > 0 ? (
				<div className="mt-auto flex flex-col gap-[3px] pt-[4px]">
					{work.links.map((l) => (
						<div
							key={l.href}
							className="flex items-center gap-[4px] text-[9px] font-semibold text-[#3189D3]"
						>
							<span aria-hidden>▶</span>
							<span className="truncate">{l.label} ↗</span>
						</div>
					))}
				</div>
			) : null}
		</div>
	);
}
