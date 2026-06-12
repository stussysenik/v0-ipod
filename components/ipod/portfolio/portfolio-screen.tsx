"use client";

import { useEffect, useRef } from "react";

import { IpodDisplay } from "@/components/ipod/display/ipod-display";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import {
	hiringMission,
	hiringPhilosophy,
	hiringTracks,
	labs,
	languages,
	nowLines,
	processPhases,
	profile,
	projects,
	proofPillars,
	photographySeries,
	tasteCollections,
	writings,
} from "@/lib/portfolio/data";
import { photos, videos } from "@/lib/portfolio/media";
import { getTitle, type Frame, type Row } from "@/lib/portfolio/os";

const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SELECTED_BG =
	"linear-gradient(180deg, rgba(104,181,242,1) 0%, rgba(49,137,211,1) 100%)";

interface PortfolioScreenProps {
	preset: IpodClassicPresetDefinition;
	frame: Frame;
	rows: Row[];
}

/**
 * Renders the active portfolio screen inside the real iPod display frame.
 *
 * It is a pure function of (frame, rows): list screens render a scrolling,
 * blue-highlighted list (matching the classic OS menu); content screens render
 * a bespoke layout for the item identified by `frame.param`.
 */
export function PortfolioScreen({ preset, frame, rows }: PortfolioScreenProps) {
	const frameRef = useRef<HTMLDivElement | null>(null);
	const screenTokens = preset.screen;
	const contentHeight = screenTokens.frameHeight - screenTokens.statusBarHeight - 2;

	const showOsMenu = frame.screen === "menu";

	return (
		<IpodDisplay
			preset={preset}
			showOsMenu={showOsMenu}
			frameRef={frameRef}
			statusBarTitle={getTitle(frame)}
			showPlayIndicator={false}
		>
			<div style={{ height: contentHeight, fontFamily: FONT }} className="bg-[#FBFBF9]">
				{rows.length > 0 ? (
					<ListView rows={rows} cursor={frame.cursor} height={contentHeight} />
				) : (
					<ContentView frame={frame} height={contentHeight} />
				)}
			</div>
		</IpodDisplay>
	);
}

// ─── List view (menu / projects / labs / cv / links / media lists) ────────────

function ListView({
	rows,
	cursor,
	height,
}: {
	rows: Row[];
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
									className="shrink-0 text-[9px] font-medium tabular-nums"
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

// ─── Content / detail views ──────────────────────────────────────────────────

function ContentView({ frame, height }: { frame: Frame; height: number }) {
	switch (frame.screen) {
		case "work":
			return <ProjectDetail index={frame.param} height={height} />;
		case "process-step":
			return <ProcessStepDetail index={frame.param} height={height} />;
		case "lab":
			return <LabDetail index={frame.param} height={height} />;
		case "photo":
			return <PhotoViewer index={frame.param} height={height} />;
		case "video":
			return <VideoViewer index={frame.param} height={height} />;
		case "writing":
			return <WritingDetail index={frame.param} height={height} />;
		case "bio":
			return <AboutView height={height} />;
		case "now":
			return <NowView height={height} />;
		case "hire-mission":
			return <HireMissionView height={height} />;
		case "hire-track":
			return <HireTrackDetail index={frame.param} height={height} />;
		case "hire-pillar":
			return <HirePillarDetail index={frame.param} height={height} />;
		case "taste-list":
			return <TasteListDetail index={frame.param} height={height} />;
		case "photos":
			return <EmptyMedia kind="photos" height={height} />;
		case "videos":
			return <EmptyMedia kind="videos" height={height} />;
		default:
			return null;
	}
}

function Pane({ children, height }: { children: React.ReactNode; height: number }) {
	return (
		<div
			className="flex h-full flex-col gap-[6px] overflow-y-auto px-[10px] py-[8px] text-[#161616]"
			style={{ height }}
		>
			{children}
		</div>
	);
}

function ProjectDetail({ index, height }: { index: number; height: number }) {
	const p = projects[index];
	if (!p) return null;
	return (
		<Pane height={height}>
			<div className="text-[11px] font-bold leading-[1.2]">{p.title}</div>
			<div className="text-[8px] font-medium uppercase tracking-[0.08em] text-[#8A8F98]">
				{[p.category, p.month ? `${p.month}/${p.year}` : p.year].filter(Boolean).join(" · ")}
			</div>
			{p.description ? (
				<div className="text-[9px] leading-[1.35] text-[#3A3F47]">{p.description}</div>
			) : null}
			{p.tools?.length ? (
				<div className="text-[8px] leading-[1.3] text-[#5A5F67]">{p.tools.join(" · ")}</div>
			) : null}
			{p.url ? (
				<div className="mt-auto flex items-center gap-[4px] text-[9px] font-semibold text-[#3189D3]">
					<span aria-hidden>▶</span>
					<span className="truncate">Center to open ↗</span>
				</div>
			) : null}
		</Pane>
	);
}

function LabDetail({ index, height }: { index: number; height: number }) {
	const l = labs[index];
	if (!l) return null;
	return (
		<Pane height={height}>
			<div className="text-[11px] font-bold leading-[1.2]">{l.title}</div>
			<div className="text-[8px] font-medium uppercase tracking-[0.08em] text-[#8A8F98]">
				{l.status} · {l.date.slice(0, 4)}
			</div>
			<div className="text-[9px] leading-[1.35] text-[#3A3F47]">{l.description}</div>
			<div className="text-[8px] leading-[1.3] text-[#5A5F67]">{l.tags.join(" · ")}</div>
		</Pane>
	);
}

function ProcessStepDetail({ index, height }: { index: number; height: number }) {
	const phase = processPhases[index];
	if (!phase) return null;
	return (
		<Pane height={height}>
			<div className="text-[8px] font-medium uppercase tracking-[0.08em] text-[#8A8F98]">
				Step {index + 1} of {processPhases.length}
			</div>
			<div className="text-[11px] font-bold leading-[1.2]">{phase.title}</div>
			<div className="text-[9px] font-semibold leading-[1.3] text-[#3189D3]">{phase.summary}</div>
			<div className="text-[9px] leading-[1.4] text-[#3A3F47]">{phase.detail}</div>
		</Pane>
	);
}

function WritingDetail({ index, height }: { index: number; height: number }) {
	const w = writings[index];
	if (!w) return null;
	return (
		<Pane height={height}>
			<div className="text-[11px] font-bold leading-[1.2]">{w.title}</div>
			<div className="text-[8px] font-medium uppercase tracking-[0.08em] text-[#8A8F98]">{w.date}</div>
			<div className="text-[9px] leading-[1.4] text-[#3A3F47]">{w.excerpt}</div>
			<div className="mt-auto text-[8px] leading-[1.3] text-[#5A5F67]">{w.tags.join(" · ")}</div>
		</Pane>
	);
}

function PhotoViewer({ index, height }: { index: number; height: number }) {
	const ph = photos[index];
	if (!ph) return <EmptyMedia kind="photos" height={height} />;
	return (
		<div className="flex h-full items-center justify-center bg-black" style={{ height }}>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img src={ph.src} alt={ph.title} className="max-h-full max-w-full object-contain" />
		</div>
	);
}

function VideoViewer({ index, height }: { index: number; height: number }) {
	const v = videos[index];
	if (!v) return <EmptyMedia kind="videos" height={height} />;
	return (
		<div className="flex h-full items-center justify-center bg-black" style={{ height }}>
			<video
				src={v.src}
				poster={v.poster}
				controls
				playsInline
				className="max-h-full max-w-full object-contain"
			/>
		</div>
	);
}

function AboutView({ height }: { height: number }) {
	return (
		<Pane height={height}>
			<div className="text-[11px] font-bold leading-[1.15]">{profile.name}</div>
			<div className="text-[9px] font-semibold text-[#3189D3]">{profile.handle}</div>
			<div className="text-[8px] font-medium uppercase tracking-[0.08em] text-[#8A8F98]">
				{profile.role}
			</div>
			<div className="text-[9px] leading-[1.4] text-[#3A3F47]">{profile.longBio}</div>
			<div className="text-[8px] leading-[1.3] text-[#5A5F67]">
				{languages.map((l) => `${l.name} ${l.level}`).join(" · ")}
			</div>
			<div className="mt-auto text-[8px] text-[#8A8F98]">
				{profile.location} · Ed. {profile.edition} · {profile.createdDate}
			</div>
		</Pane>
	);
}

// ─── Hire Me views — the 30-second recruiter scan, on-device ─────────────────

function HireMissionView({ height }: { height: number }) {
	return (
		<Pane height={height}>
			<div className="text-[11px] font-bold leading-[1.2]">Mission</div>
			<div className="text-[9px] leading-[1.4] text-[#3A3F47]">{hiringMission}</div>
			<div className="text-[9px] font-semibold leading-[1.35] text-[#3189D3]">
				“{hiringPhilosophy}”
			</div>
			<div className="mt-auto text-[8px] font-medium uppercase tracking-[0.08em] text-[#8A8F98]">
				{profile.available ? "Available · " : ""}
				{profile.location}
			</div>
		</Pane>
	);
}

function HireTrackDetail({ index, height }: { index: number; height: number }) {
	const t = hiringTracks[index];
	if (!t) return null;
	return (
		<Pane height={height}>
			<div className="text-[8px] font-medium uppercase tracking-[0.08em] text-[#8A8F98]">
				Track {index + 1} of {hiringTracks.length}
			</div>
			<div className="text-[11px] font-bold leading-[1.2]">{t.label}</div>
			<div className="text-[9px] leading-[1.4] text-[#3A3F47]">{t.summary}</div>
			<div className="mt-auto flex items-center gap-[4px] text-[9px] font-semibold text-[#3189D3]">
				<span aria-hidden>▶</span>
				<span className="truncate">Works has the proof</span>
			</div>
		</Pane>
	);
}

function HirePillarDetail({ index, height }: { index: number; height: number }) {
	const p = proofPillars[index];
	if (!p) return null;
	return (
		<Pane height={height}>
			<div className="text-[8px] font-medium uppercase tracking-[0.08em] text-[#8A8F98]">
				Proof {index + 1} of {proofPillars.length}
			</div>
			<div className="text-[11px] font-bold leading-[1.2]">{p.title}</div>
			<div className="text-[9px] leading-[1.4] text-[#3A3F47]">{p.detail}</div>
		</Pane>
	);
}

function TasteListDetail({ index, height }: { index: number; height: number }) {
	const t = tasteCollections[index];
	if (!t) return null;
	return (
		<Pane height={height}>
			<div className="text-[11px] font-bold leading-[1.2]">{t.title}</div>
			<ul className="flex flex-col gap-[4px]">
				{t.items.map((item) => (
					<li key={item} className="flex gap-[6px] text-[9px] leading-[1.35] text-[#3A3F47]">
						<span aria-hidden className="text-[#3189D3]">
							›
						</span>
						<span>{item}</span>
					</li>
				))}
			</ul>
		</Pane>
	);
}

function NowView({ height }: { height: number }) {
	return (
		<Pane height={height}>
			<div className="text-[11px] font-bold">Now</div>
			<ul className="flex flex-col gap-[5px]">
				{nowLines.map((line) => (
					<li key={line} className="flex gap-[6px] text-[9px] leading-[1.35] text-[#3A3F47]">
						<span aria-hidden className="text-[#3189D3]">
							›
						</span>
						<span>{line}</span>
					</li>
				))}
			</ul>
		</Pane>
	);
}

function EmptyMedia({ kind, height }: { kind: "photos" | "videos"; height: number }) {
	const series = kind === "photos" ? photographySeries : [];
	return (
		<Pane height={height}>
			<div className="text-[11px] font-bold capitalize">{kind}</div>
			<div className="text-[9px] leading-[1.35] text-[#3A3F47]">Coming soon — syncing media…</div>
			{series.map((s) => (
				<div key={s.title} className="text-[8px] leading-[1.3] text-[#5A5F67]">
					<span className="font-semibold text-[#3A3F47]">{s.title}</span> · {s.aspect}
				</div>
			))}
		</Pane>
	);
}
