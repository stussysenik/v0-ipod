/**
 * Portfolio OS — the navigation "operating system" the iPod runs at /portfolio.
 *
 * The mental model is a classic iPod: a STACK of screens. The click wheel moves
 * a cursor within the top screen; the center button activates the selected row;
 * the Menu button pops back up the stack. Everything is data-driven from
 * `lib/portfolio/data.ts` + `lib/portfolio/media.ts`, so screens are declared
 * once here and rendered dumbly by the scene components.
 *
 * Learner's note: this is a tiny reducer-backed state machine. Navigation is
 * pure (stack transforms), side effects (opening external links) are handled by
 * the hook, and rendering reads `rows` — a clean State / Effect / View split.
 */

"use client";

import { useCallback, useMemo, useReducer } from "react";

import { FEATURE_FLAGS } from "../feature-flags";
import {
	contactLinks,
	cv,
	hiringTracks,
	labs,
	nowLines,
	processPhases,
	profile,
	projects,
	proofPillars,
	socialLinks,
	tasteCollections,
	writings,
} from "./data";
import { photos, videos } from "./media";

// ─── Screen + row vocabulary ─────────────────────────────────────────────────

export type ScreenId =
	// root
	| "menu"
	// Hire Me → the distilled recruiter case
	| "hire"
	| "hire-mission"
	| "hire-tracks"
	| "hire-track"
	| "hire-proof"
	| "hire-pillar"
	| "hire-contact"
	// Process → its phases
	| "process"
	| "process-step"
	// Works → projects
	| "works"
	| "work"
	// Inspiration → labs/experiments
	| "inspiration"
	| "lab"
	// Likes → photos / videos / taste
	| "likes"
	| "photos"
	| "photo"
	| "videos"
	| "video"
	| "taste"
	| "taste-list"
	// Writings → posts
	| "writings"
	| "writing"
	// Now
	| "now"
	// About Me → bio / cv / links
	| "about"
	| "bio"
	| "cv"
	| "links";

/** What happens when the center button activates a row. */
export type RowAction =
	| { type: "push"; screen: ScreenId; param?: number }
	| { type: "open"; url: string }
	| { type: "none" };

export interface Row {
	id: string;
	label: string;
	/** Right-aligned hint (year, status, "›", etc.). */
	hint?: string;
	action: RowAction;
}

/**
 * A frame on the navigation stack.
 * - `cursor` = current selection within a list screen.
 * - `param`  = which item a detail screen is about (e.g. project index).
 */
export interface Frame {
	screen: ScreenId;
	cursor: number;
	param: number;
}

// ─── Screen content (rows) ───────────────────────────────────────────────────

/**
 * Root menu — proof first (Works), then the ask (Hire Me), then the practice.
 *
 * Inspiration / Likes / Writings are ARCHIVED behind flags (spec:
 * portfolio-content-sync): the shipped surface mirrors stussysenik.com, which serves
 * Works / Process / About. Their rows, screens and data are all still here — each flag
 * flip restores a row and everything behind it, so the feed has room to grow back.
 */
const MENU_ROWS: Row[] = [
	{ id: "works", label: "Works", hint: "›", action: { type: "push", screen: "works" } },
	{ id: "hire", label: "Hire Me", hint: "›", action: { type: "push", screen: "hire" } },
	{ id: "process", label: "Process", hint: "›", action: { type: "push", screen: "process" } },
	...(FEATURE_FLAGS.SHOW_PORTFOLIO_LABS
		? [{ id: "inspiration", label: "Inspiration", hint: "›", action: { type: "push", screen: "inspiration" } } as Row]
		: []),
	...(FEATURE_FLAGS.SHOW_PORTFOLIO_LIKES
		? [{ id: "likes", label: "Likes", hint: "›", action: { type: "push", screen: "likes" } } as Row]
		: []),
	...(FEATURE_FLAGS.SHOW_PORTFOLIO_WRITINGS
		? [{ id: "writings", label: "Writings", hint: "›", action: { type: "push", screen: "writings" } } as Row]
		: []),
	{ id: "now", label: "Now", hint: "›", action: { type: "push", screen: "now" } },
	{ id: "about", label: "About Me", hint: "›", action: { type: "push", screen: "about" } },
];

/** Hire Me sub-menu — the 30-second recruiter scan, in reading order. */
const HIRE_ROWS: Row[] = [
	{ id: "hire-mission", label: "Mission", hint: "›", action: { type: "push", screen: "hire-mission" } },
	{ id: "hire-tracks", label: "Tracks", hint: String(hiringTracks.length), action: { type: "push", screen: "hire-tracks" } },
	{ id: "hire-proof", label: "Proof", hint: String(proofPillars.length), action: { type: "push", screen: "hire-proof" } },
	{ id: "hire-contact", label: "Contact", hint: "›", action: { type: "push", screen: "hire-contact" } },
];

/** Likes sub-menu — media collections + curated taste. */
const LIKES_ROWS: Row[] = [
	{ id: "photos", label: "Photos", hint: "›", action: { type: "push", screen: "photos" } },
	{ id: "videos", label: "Videos", hint: "›", action: { type: "push", screen: "videos" } },
	{ id: "taste", label: "Taste", hint: "›", action: { type: "push", screen: "taste" } },
];

/** About Me sub-menu. */
const ABOUT_ROWS: Row[] = [
	{ id: "bio", label: "Bio", hint: "›", action: { type: "push", screen: "bio" } },
	{ id: "cv", label: "CV", hint: "›", action: { type: "push", screen: "cv" } },
	{ id: "links", label: "Links", hint: "›", action: { type: "push", screen: "links" } },
];

/** Build the rows for a given screen from portfolio data. */
export function getRows(screen: ScreenId): Row[] {
	switch (screen) {
		case "menu":
			return MENU_ROWS;
		case "hire":
			return HIRE_ROWS;
		case "hire-tracks":
			return hiringTracks.map((t, i) => ({
				id: t.id,
				label: t.label,
				action: { type: "push", screen: "hire-track", param: i },
			}));
		case "hire-proof":
			return proofPillars.map((p, i) => ({
				id: `pillar-${i}`,
				label: p.title,
				hint: String(i + 1),
				action: { type: "push", screen: "hire-pillar", param: i },
			}));
		case "hire-contact":
			return contactLinks.map((c) => ({
				id: c.label,
				label: c.label,
				hint: "↗",
				action: { type: "open", url: c.url },
			}));
		case "taste":
			return tasteCollections.map((t, i) => ({
				id: `taste-${i}`,
				label: t.title,
				hint: String(t.items.length),
				action: { type: "push", screen: "taste-list", param: i },
			}));
		case "process":
			return processPhases.map((p, i) => ({
				id: `phase-${i}`,
				label: p.title,
				hint: String(i + 1),
				action: { type: "push", screen: "process-step", param: i },
			}));
		case "works":
			return projects.map((p, i) => ({
				id: `work-${i}`,
				label: p.title,
				hint: String(p.year).slice(2),
				action: { type: "push", screen: "work", param: i },
			}));
		case "inspiration":
			return labs.map((l, i) => ({
				id: l.slug,
				label: l.title,
				hint: l.status,
				action: { type: "push", screen: "lab", param: i },
			}));
		case "likes":
			return LIKES_ROWS;
		case "photos":
			return photos.map((ph, i) => ({
				id: ph.id,
				label: ph.title,
				action: { type: "push", screen: "photo", param: i },
			}));
		case "videos":
			return videos.map((v, i) => ({
				id: v.id,
				label: v.title,
				hint: v.duration,
				action: { type: "push", screen: "video", param: i },
			}));
		case "writings":
			return writings.map((w, i) => ({
				id: w.slug,
				label: w.title,
				hint: w.date.slice(0, 4),
				action: { type: "push", screen: "writing", param: i },
			}));
		case "about":
			return ABOUT_ROWS;
		case "cv":
			return cv.map((c, i) => ({
				id: `cv-${i}`,
				label: c.title,
				hint: c.endDate === "present" ? "now" : c.endDate.slice(0, 4),
				action: { type: "none" },
			}));
		case "links":
			return socialLinks.map((s) => ({
				id: s.label,
				label: s.label,
				hint: "↗",
				action: { type: "open", url: s.url },
			}));
		// Content screens have no selectable rows.
		case "process-step":
		case "work":
		case "lab":
		case "photo":
		case "video":
		case "writing":
		case "bio":
		case "now":
		case "hire-mission":
		case "hire-track":
		case "hire-pillar":
		case "taste-list":
			return [];
	}
}

/** Status-bar title for a screen. */
export function getTitle(frame: Frame): string {
	switch (frame.screen) {
		case "menu":
			return profile.handle;
		case "hire":
			return "Hire Me";
		case "hire-mission":
			return "Mission";
		case "hire-tracks":
			return "Tracks";
		case "hire-track":
			return hiringTracks[frame.param]?.label ?? "Track";
		case "hire-proof":
			return "Proof";
		case "hire-pillar":
			return proofPillars[frame.param]?.title ?? "Proof";
		case "hire-contact":
			return "Contact";
		case "taste":
			return "Taste";
		case "taste-list":
			return tasteCollections[frame.param]?.title ?? "Taste";
		case "process":
			return "Process";
		case "process-step":
			return processPhases[frame.param]?.title ?? "Process";
		case "works":
			return "Works";
		case "work":
			return projects[frame.param]?.title ?? "Work";
		case "inspiration":
			return "Inspiration";
		case "lab":
			return labs[frame.param]?.title ?? "Lab";
		case "likes":
			return "Likes";
		case "photos":
			return "Photos";
		case "photo":
			return photos[frame.param]?.title ?? "Photo";
		case "videos":
			return "Videos";
		case "video":
			return videos[frame.param]?.title ?? "Video";
		case "writings":
			return "Writings";
		case "writing":
			return writings[frame.param]?.title ?? "Writing";
		case "now":
			return "Now";
		case "about":
			return "About Me";
		case "bio":
			return "Bio";
		case "cv":
			return "CV";
		case "links":
			return "Links";
	}
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

interface OsState {
	stack: Frame[];
}

type OsAction =
	| { type: "seek"; direction: number }
	| { type: "push"; screen: ScreenId; param: number }
	| { type: "pop" }
	| { type: "setCursor"; cursor: number };

const ROOT: Frame = { screen: "menu", cursor: 0, param: 0 };

function clamp(value: number, max: number): number {
	if (max <= 0) return 0;
	return Math.max(0, Math.min(max - 1, value));
}

function reducer(state: OsState, action: OsAction): OsState {
	const top = state.stack[state.stack.length - 1];

	switch (action.type) {
		case "seek": {
			const count = getRows(top.screen).length;
			if (count === 0) return state;
			const next = clamp(top.cursor + Math.sign(action.direction), count);
			if (next === top.cursor) return state;
			return {
				stack: [...state.stack.slice(0, -1), { ...top, cursor: next }],
			};
		}
		case "push": {
			const frame: Frame = { screen: action.screen, cursor: 0, param: action.param };
			return { stack: [...state.stack, frame] };
		}
		case "pop": {
			if (state.stack.length <= 1) return state;
			return { stack: state.stack.slice(0, -1) };
		}
		case "setCursor": {
			const count = getRows(top.screen).length;
			return {
				stack: [...state.stack.slice(0, -1), { ...top, cursor: clamp(action.cursor, count) }],
			};
		}
	}
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export interface PortfolioOs {
	frame: Frame;
	rows: Row[];
	depth: number;
	seek: (direction: number) => void;
	select: () => void;
	back: () => void;
	/** Step within a detail screen (photo viewer next/prev, etc.). */
	step: (direction: number) => void;
	setCursor: (cursor: number) => void;
}

export function usePortfolioOs(onOpenUrl?: (url: string) => void): PortfolioOs {
	const [state, dispatch] = useReducer(reducer, { stack: [ROOT] });
	const frame = state.stack[state.stack.length - 1];
	const rows = useMemo(() => getRows(frame.screen), [frame.screen]);

	const seek = useCallback((direction: number) => {
		dispatch({ type: "seek", direction });
	}, []);

	const back = useCallback(() => dispatch({ type: "pop" }), []);

	const setCursor = useCallback((cursor: number) => {
		dispatch({ type: "setCursor", cursor });
	}, []);

	const select = useCallback(() => {
		const currentRows = getRows(frame.screen);
		const row = currentRows[frame.cursor];
		if (row) {
			const { action } = row;
			if (action.type === "push") {
				dispatch({ type: "push", screen: action.screen, param: action.param ?? 0 });
			} else if (action.type === "open") {
				onOpenUrl?.(action.url);
			}
			return;
		}
		// Content screens: center opens the item's primary external link.
		if (frame.screen === "work") {
			const url = projects[frame.param]?.url;
			if (url) onOpenUrl?.(url);
		} else if (frame.screen === "lab") {
			const url = labs[frame.param]?.sourceUrl;
			if (url) onOpenUrl?.(url);
		}
	}, [frame, onOpenUrl]);

	// Detail-screen stepping (e.g. next/prev photo) wraps around its sibling set.
	const step = useCallback(
		(direction: number) => {
			const siblings: Partial<Record<ScreenId, number>> = {
				"process-step": processPhases.length,
				work: projects.length,
				lab: labs.length,
				photo: photos.length,
				video: videos.length,
				writing: writings.length,
				"hire-track": hiringTracks.length,
				"hire-pillar": proofPillars.length,
				"taste-list": tasteCollections.length,
			};
			const total = siblings[frame.screen];
			if (!total) return;
			const nextParam = (frame.param + Math.sign(direction) + total) % total;
			dispatch({ type: "pop" });
			dispatch({ type: "push", screen: frame.screen, param: nextParam });
		},
		[frame],
	);

	return {
		frame,
		rows,
		depth: state.stack.length,
		seek,
		select,
		back,
		step,
		setCursor,
	};
}
