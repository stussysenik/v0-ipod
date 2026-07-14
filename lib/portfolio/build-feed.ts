/**
 * Portfolio feed builder — the one place `content/senik.feed.json` comes from.
 *
 * Why this exists: `senik.feed.json` is what `/portfolio` and `/3d-portfolio` actually
 * render, but it used to be authored *by hand* from `lib/portfolio/data.ts`. The two
 * drifted — the feed carried a work (`iPod emulator`) that had been cut, a role that had
 * been retitled, and a dead project URL. Nothing caught it, because nothing could: two
 * sources of truth with no derivation between them cannot be kept honest by review.
 *
 * So the feed is now *derived*. `data.ts` is the source; this is the projection; and
 * `build-feed.test.ts` asserts the checked-in JSON still equals what this function
 * emits, which turns "someone forgot to regenerate" from a silent content bug into a
 * failing unit test. Regenerate with `pnpm feed:build`.
 *
 * Archived sections (Writing, Labs, Likes — see `lib/feature-flags.ts`) are simply not
 * projected while their flag is false. Their content stays in `data.ts`; flipping the
 * flag and rebuilding brings the whole section back, rows and all.
 */

import { FEATURE_FLAGS } from "../feature-flags";
import { FEED_VERSION, type IpodFeed, type MenuNode, type Work } from "../feed/schema";
import {
	contactLinks,
	cv,
	labs,
	processPhases,
	profile,
	projects,
	socialLinks,
	writings,
} from "./data";

/** The device's own palette. Design tokens, not content — authored here, not in data.ts. */
const THEME = {
	accent: "#0048FF",
	background: "#000000",
	surface: "#0b0b0d",
	foreground: "#f5f5f7",
	muted: "#8a8a8e",
	fontSans: "'Inter', system-ui, sans-serif",
	fontMono: "'Berkeley Mono', ui-monospace, monospace",
	radius: "12px",
} as const;

/** `RE:IMAGINE` → `re-imagine`. The schema requires kebab-case slugs. */
function kebab(input: string): string {
	return input
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function projectToWork(p: (typeof projects)[number]): Work {
	return {
		slug: p.slug,
		title: p.title,
		...(p.description ? { summary: p.description } : {}),
		year: String(p.year),
		tags: p.category ? [p.category] : [],
		links: p.url ? [{ label: "Live", href: p.url }] : [],
	};
}

function phaseToWork(phase: (typeof processPhases)[number]): Work {
	return {
		slug: `process-${kebab(phase.title)}`,
		title: phase.title,
		summary: phase.summary,
		tags: ["process"],
		links: [],
		body: phase.detail,
	};
}

/**
 * The About card. Its body is the bio followed by the hiring summary, and its rows are
 * the education history — the identity, schooling and GitHub the snapshot calls for,
 * all read from `data.ts` rather than restated here.
 */
function aboutWork(): Work {
	const education = cv
		.filter((entry) => entry.type === "education")
		.map((entry) => {
			const years = `${entry.startDate.slice(0, 4)}–${entry.endDate.slice(0, 4)}`;
			return `${entry.organization} — ${entry.title} (${years})`;
		})
		.join("\n");

	return {
		slug: "about",
		title: "About",
		summary: `${profile.role}. ${profile.location}.`,
		year: String(new Date(profile.createdDate).getFullYear() || 2026),
		role: profile.role,
		tags: ["about"],
		links: contactLinks
			.filter((l) => l.label !== "X / Twitter")
			.map((l) => ({ label: l.label, href: l.url })),
		body: [profile.longBio, profile.summary, education].join("\n\n"),
	};
}

function writingToWork(w: (typeof writings)[number]): Work {
	return {
		slug: w.slug,
		title: w.title,
		summary: w.excerpt,
		year: w.date.slice(0, 4),
		tags: w.tags,
		links: [],
		body: w.excerpt,
	};
}

function labToWork(l: (typeof labs)[number]): Work {
	return {
		slug: `lab-${l.slug}`,
		title: l.title,
		summary: l.description,
		year: l.date.slice(0, 4),
		tags: [...l.tags, l.status],
		links: l.sourceUrl ? [{ label: "Source", href: l.sourceUrl }] : [],
	};
}

/** Project a pool of works into a menu section that opens each by slug. */
function section(id: string, label: string, works: Work[], labelOf?: (w: Work) => string): MenuNode {
	return {
		id,
		label,
		children: works.map((w) => ({
			id: `m-${w.slug}`,
			label: labelOf?.(w) ?? w.title,
			slug: w.slug,
		})),
	};
}

/**
 * Build the whole manifest. Pure: same `data.ts` + same flags ⇒ byte-identical output,
 * which is what lets the freshness test compare it against the checked-in file.
 */
export function buildSenikFeed(): IpodFeed {
	const workWorks = projects.map(projectToWork);
	const processWorks = processPhases.map(phaseToWork);
	const writingWorks = writings.map(writingToWork);
	const labWorks = labs.map(labToWork);
	const about = aboutWork();

	// Short list labels come from `data.ts`, so the narrow iPod row and the full title
	// can differ without a second source deciding it.
	const shortLabel = new Map(projects.map((p) => [p.slug, p.shortTitle ?? p.title]));

	const menu: MenuNode[] = [
		section("works", "Works", workWorks, (w) => shortLabel.get(w.slug) ?? w.title),
		section("process", "Process", processWorks),
		...(FEATURE_FLAGS.SHOW_PORTFOLIO_WRITINGS ? [section("writing", "Writing", writingWorks)] : []),
		...(FEATURE_FLAGS.SHOW_PORTFOLIO_LABS ? [section("labs", "Labs", labWorks)] : []),
		{ id: "about", label: "About", slug: about.slug },
		{
			id: "contact",
			label: "Contact",
			children: [
				...contactLinks.map((l) => ({ id: `c-${kebab(l.label)}`, label: l.label, href: l.url })),
				{
					id: "social",
					label: "Social",
					children: socialLinks.map((l) => ({
						id: `s-${kebab(l.label)}`,
						label: l.label,
						href: l.url,
					})),
				},
			],
		},
	];

	return {
		version: FEED_VERSION,
		meta: {
			id: "senik",
			title: "Stüssy Senik",
			description: profile.shortBio,
			author: profile.name,
			url: "https://ipod-music.vercel.app",
		},
		theme: { ...THEME },
		menu,
		works: [
			...workWorks,
			...processWorks,
			...(FEATURE_FLAGS.SHOW_PORTFOLIO_WRITINGS ? writingWorks : []),
			...(FEATURE_FLAGS.SHOW_PORTFOLIO_LABS ? labWorks : []),
			about,
		],
		assets: [],
	};
}
