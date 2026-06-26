/**
 * Work surface — IA model C: a work expands out of the device into a full-size
 * surface that overlays the stage (real space for real content), with a return
 * affordance back to the menu. It spans the whole keep-out grid (see `.work-surface`
 * in globals.css) so it lives OUTSIDE the device keep-out cell — never cramped into
 * the little screen.
 */

import type { Asset, Work } from "@/lib/feed/schema";

export function WorkSurface({
	work,
	cover,
	onBack,
}: {
	work: Work;
	cover?: Asset;
	onBack: () => void;
}) {
	const meta = [work.year, work.role, ...work.tags].filter(Boolean).join(" · ");
	return (
		<section
			className="work-surface"
			role="dialog"
			aria-label={work.title}
			style={work.accent ? { ["--ipod-accent" as string]: work.accent } : undefined}
		>
			<button type="button" className="work-surface__back" onClick={onBack}>
				← Menu
			</button>
			<h2 className="work-surface__title">{work.title}</h2>
			{meta ? <p className="work-surface__meta">{meta}</p> : null}
			{cover ? (
				// eslint-disable-next-line @next/next/no-img-element -- feed covers are arbitrary URLs
				<img className="work-surface__cover" src={cover.src} alt={cover.alt ?? work.title} />
			) : null}
			{work.summary ? <p className="work-surface__body">{work.summary}</p> : null}
			{work.body ? <div className="work-surface__body">{work.body}</div> : null}
			{work.links.length > 0 ? (
				<div className="work-surface__links">
					{work.links.map((l) => (
						<a
							key={l.href}
							className="work-surface__link"
							href={l.href}
							target="_blank"
							rel="noopener noreferrer"
						>
							{l.label} ↗
						</a>
					))}
				</div>
			) : null}
		</section>
	);
}
