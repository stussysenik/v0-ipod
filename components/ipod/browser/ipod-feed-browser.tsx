"use client";

/**
 * IpodFeedBrowser — the shared React renderer.
 *
 * Composes the three framework-neutral cores into a working device: the feed (data),
 * the nav machine (interaction), and the keep-out stage (space). It is the renderer
 * `/portfolio` and `/whitelabel` mount; the Lit `<ipod-classic>` element renders the
 * same cores in its own DOM. The device, screen, and wheel are self-contained CSS
 * (no WebGL, no heavy deps) so the whole thing is droppable and container-responsive.
 *
 * Theme tokens become `--ipod-*` variables on the stage root, so a feed swap re-skins
 * the entire surface with zero code change — the white-label promise.
 */

import { useMemo } from "react";

import { loadFeed } from "@/lib/feed/load";
import type { IpodFeed } from "@/lib/feed/schema";
import { themeToCssVars } from "@/lib/feed/theme";
import { focusedNode } from "@/lib/nav/machine";

import { SlugPreview } from "./slug-preview";
import { useFeedNav } from "./use-feed-nav";
import { WorkSurface } from "./work-surface";

export function IpodFeedBrowser({ feed, className }: { feed: IpodFeed; className?: string }) {
	// Validate + index once per feed. Invalid feeds throw loudly at the boundary.
	const model = useMemo(() => loadFeed(feed), [feed]);
	const { state, dispatch, onKeyDown } = useFeedNav(feed);

	const frame = state.stack[state.stack.length - 1];
	const focused = focusedNode(state);
	const openWork = state.view.kind === "work" ? model.worksBySlug.get(state.view.slug) : undefined;

	const themeStyle = useMemo(
		() => themeToCssVars(feed.theme) as React.CSSProperties,
		[feed.theme],
	);

	// On-screen body: the menu list, or the focused work's link-bio preview as a peek.
	const screenBody =
		state.view.kind === "work" && openWork ? (
			<SlugPreview work={openWork} cover={model.resolveCover(openWork)} />
		) : (
			<ul className="ipod-menu" role="listbox" aria-label={frame?.parentId ?? "menu"}>
				{frame?.nodes.map((node, i) => (
					<li
						key={node.id}
						role="option"
						aria-selected={i === frame.focus}
						className="ipod-menu__row"
						onMouseEnter={() => dispatch({ type: "focus", index: i })}
						onClick={() => {
							dispatch({ type: "focus", index: i });
							dispatch({ type: "select" });
						}}
					>
						<span>{node.label}</span>
						<span className="ipod-menu__chevron" aria-hidden="true">
							{node.children ? "›" : node.href ? "↗" : ""}
						</span>
					</li>
				))}
			</ul>
		);

	return (
		<div className={`keepout-stage${className ? ` ${className}` : ""}`} style={themeStyle}>
			<div className="keepout-stage__device">
				{/* The device is the focusable browser surface; arrows/enter drive nav. */}
				{/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the device IS the control */}
				<div
					className="ipod-device"
					tabIndex={0}
					role="application"
					aria-label={`${feed.meta.title} — iPod browser`}
					onKeyDown={onKeyDown}
				>
					<div className="ipod-screen">
						<div className="ipod-screen__statusbar">
							<span>{frame?.parentId === "root" ? feed.meta.title : focused?.label ?? "iPod"}</span>
							<span aria-hidden="true">▶</span>
						</div>
						<div className="ipod-screen__body">{screenBody}</div>
					</div>

					<div className="ipod-wheel" aria-hidden="false">
						<button
							type="button"
							className="ipod-wheel__btn ipod-wheel__btn--menu"
							onClick={() => dispatch({ type: "back" })}
						>
							MENU
						</button>
						<button
							type="button"
							className="ipod-wheel__btn ipod-wheel__btn--prev"
							aria-label="Previous"
							onClick={() => dispatch({ type: "prev" })}
						>
							⏮
						</button>
						<button
							type="button"
							className="ipod-wheel__btn ipod-wheel__btn--next"
							aria-label="Next"
							onClick={() => dispatch({ type: "next" })}
						>
							⏭
						</button>
						<button
							type="button"
							className="ipod-wheel__btn ipod-wheel__btn--play"
							aria-label="Play / Pause"
							onClick={() => dispatch({ type: "select" })}
						>
							⏯
						</button>
						<button
							type="button"
							className="ipod-wheel__center"
							aria-label="Select"
							onClick={() => dispatch({ type: "select" })}
						/>
					</div>
				</div>
			</div>

			{/* IA-C expand: full-size surface OUTSIDE the device keep-out cell. */}
			{openWork ? (
				<WorkSurface
					work={openWork}
					cover={model.resolveCover(openWork)}
					onBack={() => dispatch({ type: "back" })}
				/>
			) : null}
		</div>
	);
}
