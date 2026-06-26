/**
 * Slug preview — a work as a self-contained, link-bio-grade card.
 *
 * Renders standalone (no nav context) so it works on the device screen, in a rail,
 * or anywhere a single work needs a compact face. Cover falls back to the title's
 * initial when no asset resolves — never a broken image.
 */

import type { Asset, Work } from "@/lib/feed/schema";

export function SlugPreview({ work, cover }: { work: Work; cover?: Asset }) {
	const meta = [work.year, work.role].filter(Boolean).join(" · ");
	return (
		<article className="slug-preview" style={work.accent ? { ["--ipod-accent" as string]: work.accent } : undefined}>
			{cover ? (
				// eslint-disable-next-line @next/next/no-img-element -- feed covers are arbitrary remote/local URLs
				<img className="slug-preview__cover" src={cover.src} alt={cover.alt ?? work.title} />
			) : (
				<div className="slug-preview__cover" aria-hidden="true">
					{work.title.charAt(0)}
				</div>
			)}
			<h3 className="slug-preview__title">{work.title}</h3>
			{meta ? <p className="slug-preview__meta">{meta}</p> : null}
			{work.summary ? <p className="slug-preview__summary">{work.summary}</p> : null}
			{work.links.length > 0 ? (
				<div className="slug-preview__links">
					{work.links.map((l) => (
						<a
							key={l.href}
							className="slug-preview__link"
							href={l.href}
							target="_blank"
							rel="noopener noreferrer"
						>
							{l.label}
						</a>
					))}
				</div>
			) : null}
		</article>
	);
}
