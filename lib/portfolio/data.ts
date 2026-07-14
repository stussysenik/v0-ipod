/**
 * Portfolio content — ported from `sveltekit-portfolio-forever`.
 *
 * This is the single source of truth for everything the iPod "serves" at
 * `/portfolio`. It is intentionally plain data (no framework coupling) so the
 * iPod OS layer (see `lib/portfolio/os.ts`) can treat it as a content feed and
 * the screen components can stay dumb renderers.
 *
 * Learner's note: keeping *content* (this file) separate from *navigation*
 * (os.ts) and *presentation* (the scene components) is the same Presentation /
 * State / Data split the workbench uses elsewhere — it lets each layer change
 * without dragging the others along.
 */

// ─── Identity ──────────────────────────────────────────────────────────────

export interface PortfolioProfile {
	name: string;
	handle: string;
	role: string;
	taglineJa: string;
	shortBio: string;
	longBio: string;
	/** The one-paragraph hiring summary (mirrors the CV's JSON-LD summary). */
	summary: string;
	location: string;
	email: string;
	edition: string;
	createdDate: string;
	available: boolean;
}

export const profile: PortfolioProfile = {
	name: 'MENGXUAN "SENIK" ZOU',
	handle: "Stüssy Senik",
	role: "R&D Experience Design Engineer",
	taglineJa: "クリエイティブ・テクノロジスト",
	shortBio:
		"Building at the intersection of engineering, creative production, and design — from code to camera",
	longBio:
		"Formally trained Software Engineer turned Artist & self-taught Designer with 8+ years crafting delight through impactful interfaces, experiences & artifacts. My practice applies computational techniques to augment the design & art-direction process. Building tools and experiences with 1 billion people in mind.",
	summary:
		"Polymath engineer at the convergence of software, film, music, and design. Formally trained at Cooper Union and FAMU Prague, with production experience spanning B2B product engineering, simultaneous translation across 4 languages, community radio, and EU-funded filmmaking.",
	location: "NYC / PRAGUE",
	email: "itsmxzou@gmail.com",
	edition: "01",
	createdDate: "January 2026",
	available: true,
};

/** Spoken languages — a hiring signal in its own right (4-language translator). */
export interface Language {
	name: string;
	level: string;
}

export const languages: Language[] = [
	{ name: "EN", level: "Native / Fluent" },
	{ name: "中文 ZH", level: "Native" },
	{ name: "CZ", level: "Fluent" },
	{ name: "DE", level: "Conversational" },
];

export interface PortfolioLink {
	label: string;
	url: string;
}

export const socialLinks: PortfolioLink[] = [
	{ label: "GitHub", url: "https://github.com/stussysenik" },
	{ label: "LinkedIn", url: "https://www.linkedin.com/in/mxzou" },
	{ label: "Instagram", url: "https://instagram.com/mx.zou" },
	{ label: "X / Twitter", url: "https://x.com/mx_zou" },
	{ label: "SoundCloud", url: "https://on.soundcloud.com/b7PpyyqCuScmugtNZc" },
	{ label: "IMDb", url: "https://www.imdb.com/name/nm14502866/" },
];

// ─── Projects (Works) ────────────────────────────────────────────────────────

export type ProjectCategory =
	| "tool"
	| "science"
	| "music"
	| "music DJ"
	| "AR/XR"
	| "art"
	| "personal software"
	| "design"
	| "technology"
	| "film";

export interface Project {
	/**
	 * Stable, kebab-case address for this work. It is the permalink the feed indexes by
	 * (`worksBySlug`), so it is authored here rather than derived from the title —
	 * retitling a work must not silently break a link that is already in the wild.
	 */
	slug: string;
	year: number;
	month?: number;
	title: string;
	/** Short label for the iPod's list rows, where the full title would truncate. */
	shortTitle?: string;
	description?: string;
	url?: string;
	category?: ProjectCategory;
	tools?: string[];
}

/**
 * Newest-first. The eleven works served at stussysenik.com/works — copied, not
 * paraphrased (spec: portfolio-content-sync, D5). Do not add works here: this feed is
 * the portfolio's proof surface, and an entry that is not on the canonical site is
 * drift. The iPod emulator itself is deliberately absent — the visitor is holding it.
 */
export const projects: Project[] = [
	{
		slug: "fyoa-find-your-own-answer",
		year: 2026,
		month: 1,
		title: "FYOA: Find your own answer",
		shortTitle: "FYOA: Find Your Own Answer",
		description: "An answer-engine experiment.",
		url: "https://perplexica.stussysenik.com",
		category: "tool",
	},
	{
		slug: "spinning-wheel-ar-filter",
		year: 2026,
		month: 1,
		title: "spinning wheel AR face filter lottery",
		shortTitle: "Spinning Wheel AR Filter",
		url: "https://spinning-wheel-filter.vercel.app",
		category: "AR/XR",
	},
	{
		slug: "mymind-clone",
		year: 2026,
		month: 1,
		title: "mymind.com clone",
		description: "Curate your own network — a personal mind/bookmarking tool.",
		url: "https://curate-your-own-network.stussysenik.com",
		category: "personal software",
	},
	{
		slug: "clean-writer-typewriter",
		year: 2025,
		month: 12,
		title: "typewriter that doesn't delete, or can't go back",
		shortTitle: "Typewriter (no backspace)",
		description: "A writing tool that refuses the backspace.",
		url: "https://clean-writer.vercel.app",
		category: "tool",
	},
	{
		slug: "ar-bboy-filter",
		year: 2025,
		month: 12,
		title: "AR b-boy filter",
		shortTitle: "AR B-Boy Filter",
		url: "https://bboy-filter.vercel.app",
		category: "AR/XR",
	},
	{
		slug: "uyr-problem",
		year: 2025,
		month: 12,
		title: "uyr-problem",
		description: "A cooking tool.",
		url: "https://reflex-untangle-your-problem.onrender.com",
		category: "tool",
	},
	{
		slug: "infinite-checklist",
		year: 2025,
		month: 12,
		title: "infinite checklist",
		shortTitle: "Infinite Checklist",
		url: "https://infinite-checklist.vercel.app",
		category: "tool",
	},
	{
		slug: "creative-block",
		year: 2025,
		month: 12,
		title: "ARE YOU HAVING A CREATIVE BLOCK?",
		shortTitle: "Creative Block?",
		url: "https://creative-block.vercel.app",
		category: "art",
	},
	{
		slug: "dvd-corner-animation",
		year: 2025,
		month: 2,
		title: "DVD corner video animation",
		shortTitle: "DVD Corner Animation",
		description: "The bouncing DVD logo, done in Three.js.",
		url: "https://dvd-video-animation.vercel.app",
		category: "technology",
		tools: ["Three.js", "WebGL"],
	},
	{
		slug: "ph-213-em-viz",
		year: 2024,
		month: 11,
		title: "PH-213 — Electricity, Current & Magnetism viz",
		shortTitle: "PH-213 E&M Viz",
		description: "Concept visualizations for an E&M physics course.",
		url: "https://ph213.vercel.app",
		category: "science",
	},
	{
		slug: "wavelength-radio",
		year: 2024,
		month: 10,
		title: "@WAVELENGTH RADIO",
		description:
			"Founded and grew a global radio community inspired by Virgil Abloh's legacy.",
		url: "https://wavelength-radio.vercel.app",
		category: "music DJ",
	},
];

// ─── Labs (interactive experiments) ──────────────────────────────────────────

export type LabStatus = "stable" | "beta" | "experimental" | "archived";

export interface LabExperiment {
	slug: string;
	title: string;
	description: string;
	date: string;
	status: LabStatus;
	tags: string[];
	sourceUrl?: string;
}

export const labs: LabExperiment[] = [
	{
		slug: "raymarch-wgsl",
		title: "WGSL Raymarcher",
		description:
			"Real-time raymarched 3D scene in WebGPU compute shaders — SDF primitives, soft shadows, ambient occlusion.",
		date: "2025-01-02",
		status: "stable",
		tags: ["raymarching", "webgpu", "sdf"],
	},
	{
		slug: "particle-physics",
		title: "GPU Particle System",
		description: "100,000+ particles with physics running entirely on GPU compute.",
		date: "2024-12-15",
		status: "stable",
		tags: ["webgpu", "particles"],
	},
	{
		slug: "wasm-fluid",
		title: "WASM Fluid Simulation",
		description: "Navier-Stokes solver compiled from Rust to WebAssembly.",
		date: "2024-11-28",
		status: "beta",
		tags: ["wasm", "webgl2", "fluid"],
	},
	{
		slug: "audio-visualizer",
		title: "Audio Worklet Visualizer",
		description: "Real-time FFT analysis with GPU-accelerated visualization.",
		date: "2024-10-20",
		status: "stable",
		tags: ["audio-worklet", "webgl2"],
	},
	{
		slug: "fractal-zoom",
		title: "Mandelbrot Zoom",
		description: "Infinite zoom into the Mandelbrot set with arbitrary precision.",
		date: "2024-09-10",
		status: "experimental",
		tags: ["webgpu", "fractal"],
	},
	{
		slug: "ascii-render",
		title: "ASCII 3D Renderer",
		description: "Classic 3D objects rendered as ASCII art.",
		date: "2024-08-01",
		status: "archived",
		tags: ["webgl2", "ascii"],
	},
];

// ─── CV ──────────────────────────────────────────────────────────────────────

export interface CvEntry {
	type: "work" | "education" | "award";
	title: string;
	organization: string;
	location?: string;
	startDate: string;
	endDate: string;
	description?: string;
}

export const cv: CvEntry[] = [
	{
		type: "award",
		title: "#1 Product of the Day",
		organization: "Product Hunt",
		startDate: "2025-09",
		endDate: "2025-09",
		description: "Attendu — recognized as the top product launch of the day.",
	},
	{
		type: "work",
		title: "AI/ML Growth Product Design Engineer",
		organization: "Attendu",
		location: "Prague, Czechia",
		startDate: "2026-02",
		endDate: "present",
		description:
			"Shipping production-ready B2B features for high-trust, risk, safety and resilience coding scenarios. T-shaped development spanning QA assurance and product ownership; setting leadership in the Czech market for parallel agent development and DevOps.",
	},
	{
		type: "work",
		title: "Growth Hacker",
		organization: "@WAVELENGTH RADIO",
		location: "New York, US",
		startDate: "2024-09",
		endDate: "present",
		description:
			"Founded and grew a global radio community platform inspired by Virgil Abloh's legacy.",
	},
	{
		type: "work",
		title: "Business Development Translator",
		organization: "Dahua Technology",
		location: "Budapest, Hungary",
		startDate: "2025-10",
		endDate: "2026-02",
	},
	{
		type: "work",
		title: "Simultaneous Translator",
		organization: "RIWAY International",
		location: "Singapore",
		startDate: "2021-01",
		endDate: "2022-03",
	},
	{
		type: "work",
		title: "Project Program Coordinator",
		organization: "Flip Makers",
		location: "Remote",
		startDate: "2020-03",
		endDate: "2021-03",
	},
	{
		type: "work",
		title: "Junior Frontend Software Engineer",
		organization: "Attendu",
		location: "Prague, Czechia",
		startDate: "2019-05",
		endDate: "2019-08",
		description: "Vue.js, REST API, Postman, CSS.",
	},
	{
		type: "work",
		title: "Steadicam Operator & Location Scout",
		organization: "IMAGE.IN / EU-funded (OPU)",
		location: "Prague, Czechia",
		startDate: "2018-12",
		endDate: "2019-05",
	},
	{
		type: "education",
		title: "Computer Engineering + Interdisciplinary Arts",
		organization: "The Cooper Union",
		location: "New York, NY",
		startDate: "2022-09",
		endDate: "2025-05",
	},
	{
		type: "education",
		title: "AAS, Film Production & Creative Management",
		organization: "FAMU",
		location: "Prague, Czechia",
		startDate: "2021-07",
		endDate: "2022-07",
	},
	{
		type: "education",
		title: "High School Diploma, Liberal Arts",
		organization: "Northfield Mount Hermon",
		location: "Gill, MA",
		startDate: "2019-08",
		endDate: "2021-05",
	},
	{
		type: "education",
		title: "High School Diploma, Liberal Arts",
		organization: "Gymnázium Altis",
		location: "Prague, Czechia",
		startDate: "2015-09",
		endDate: "2019-06",
	},
];

// ─── Photography ───────────────────────────────────────────────────────────

export interface PhotoSeries {
	title: string;
	aspect: string;
	equipment: string[];
}

export const photographySeries: PhotoSeries[] = [
	{
		title: "Street Photography",
		aspect: "16:9",
		equipment: ["Leica M6 · 35mm Summicron", "Sony A7R V · 24-70 GM II"],
	},
	{
		title: "Magazine Studies",
		aspect: "3:4",
		equipment: ["Hasselblad 500C/M · 80mm Planar", "iPhone 16 Pro — computational raw"],
	},
];

// ─── Process ─────────────────────────────────────────────────────────────────

export interface ProcessPhase {
	title: string;
	summary: string;
	detail: string;
}

/**
 * The three-step creative workflow — "1.REMIX 2.RE-THINK 3.RE:IMAGINE", the process
 * served at stussysenik.com (spec: portfolio-content-sync, D5). The step names are the
 * site's; the supporting copy is carried over from the earlier four-phase write-up in
 * this file (Research / Prototype / Refine / Ship) rather than newly invented.
 */
export const processPhases: ProcessPhase[] = [
	{
		title: "REMIX",
		summary: "Gather references, constraints, and the real problem.",
		detail:
			"Start wide: collect references, talk to people, map constraints and the actual job-to-be-done. Computational tools augment the search — scraping, clustering, moodboarding — but the goal is a sharp problem statement before a single pixel.",
	},
	{
		title: "RE-THINK",
		summary: "Make the roughest thing that proves the idea, then tighten it.",
		detail:
			"Build the crudest artifact that can be felt: a clickable sketch, a shader toy, a paper cut-out. Optimize for learning per hour, not polish — the prototype's only job is to kill or confirm the direction. Once the idea holds, obsess over the invisible details: spacing, easing, contrast, the half-pixel. This is where craft lives.",
	},
	{
		title: "RE:IMAGINE",
		summary: "Get it in front of people; measure; re-open the loop.",
		detail:
			"Ship to learn. Instrument it, watch real use, and treat launch as the start of the loop, not the end. What comes back from real hands is the feedback signal that re-opens the remix.",
	},
];

// ─── Writings ────────────────────────────────────────────────────────────────

export interface Writing {
	slug: string;
	title: string;
	date: string;
	excerpt: string;
	tags: string[];
}

export const writings: Writing[] = [
	{
		slug: "20260410-webgpu-compute",
		title: "WebGPU Compute Shaders for Generative Art",
		date: "2026-04-10",
		excerpt:
			"A deep dive into using WebGPU compute shaders for real-time generative art.",
		tags: ["webgpu", "graphics", "rust"],
	},
	{
		slug: "20260325-clojure-svelte",
		title: "Expressiveness in UI: Clojure and Svelte",
		date: "2026-03-25",
		excerpt:
			"How we ported our portfolio logic to Clojure (Squint) while keeping Svelte 5 for rendering.",
		tags: ["clojure", "svelte", "architecture"],
	},
	{
		slug: "20260215-minimalism",
		title: "Digital Minimalism in 2026",
		date: "2026-02-15",
		excerpt: "Why websites should be fast, accessible, and respect user autonomy.",
		tags: ["design", "minimalism", "ux"],
	},
	{
		slug: "20250105-webgpu-vs-webgl",
		title: "WebGPU vs WebGL: A Practical Comparison",
		date: "2025-01-05",
		excerpt:
			"After six months of WebGPU in production, here are my honest thoughts on when to use each API.",
		tags: ["webgpu", "webgl", "performance"],
	},
	{
		slug: "20241220-raymarching-basics",
		title: "Raymarching from Scratch in WGSL",
		date: "2024-12-20",
		excerpt:
			"Building a raymarcher entirely in WebGPU compute shaders. No Three.js, no abstractions.",
		tags: ["raymarching", "wgsl", "shaders"],
	},
	{
		slug: "20241115-compute-shaders",
		title: "Introduction to Compute Shaders",
		date: "2024-11-15",
		excerpt:
			"GPGPU on the web, demystified — how to think in workgroups and parallel dispatch.",
		tags: ["webgpu", "compute", "gpgpu"],
	},
	{
		slug: "20241030-svelte-vs-react-2024",
		title: "Why I Switched from React to SvelteKit in 2024",
		date: "2024-10-30",
		excerpt:
			"Less ceremony, more output. A pragmatic account of moving a portfolio off React.",
		tags: ["svelte", "react", "framework"],
	},
	{
		slug: "20240915-ascii-aesthetics",
		title: "The Return of ASCII Aesthetics in Web Design",
		date: "2024-09-15",
		excerpt:
			"Why monospace brutalism keeps coming back, and how to use it without cosplay.",
		tags: ["design", "brutalism", "ascii"],
	},
];

// ─── Taste (curated likes, ported from the canonical site's likes feed) ──────

export interface TasteCollection {
	title: string;
	items: string[];
}

export const tasteCollections: TasteCollection[] = [
	{
		title: "Typography",
		items: ["Klim Type Foundry", "Lineto", "Optimo", "Grilli Type", "Pangram Pangram", "Dinamo"],
	},
	{
		title: "Design",
		items: ["Are.na", "Mymind", "Hoverstat.es", "Godly", "Savee", "Siteinspire"],
	},
	{
		title: "Engineering",
		items: ["Vercel", "Convex", "Svelte", "Rust", "Clojure", "Zig"],
	},
	{
		title: "Art & Film",
		items: ["A24", "Criterion", "MUBI", "NOWNESS", "Kino Lorber"],
	},
	{
		title: "Reading",
		items: ["The Atlantic", "The New Yorker", "Wired", "New York Magazine", "MIT Technology Review"],
	},
];

// ─── Hire (the distilled case — ported from the hiring-proof manifest) ───────
//
// Voice and content mirror `portfolio-forever`'s HIRE.md + hiring-target.ts:
// proof over theater. The iPod serves the 30-second recruiter scan: what I do
// (tracks), why to believe it (pillars), and how to reach me (contact).

export const hiringMission =
	"Direct proof for design engineering, AI-native product craft, and frontend systems work where clarity, trust, and taste matter.";

/** The inverse-law line the whole portfolio is designed around. */
export const hiringPhilosophy =
	"The more you leave out, the more you magnify what remains.";

export interface HiringTrack {
	id: string;
	label: string;
	summary: string;
}

export const hiringTracks: HiringTrack[] = [
	{
		id: "design-engineer",
		label: "Design Engineer",
		summary:
			"Concept to code with no fidelity gap between prototype, system, and shipped surface.",
	},
	{
		id: "ai-product",
		label: "AI Product Craft",
		summary:
			"Interfaces for probabilistic systems that feel trustworthy, legible, and actually useful.",
	},
	{
		id: "frontend-systems",
		label: "Frontend Systems",
		summary:
			"Typed, responsive, accessible interfaces for expert users, mobile contexts, and high-stakes workflows.",
	},
	{
		id: "mobile-engineering",
		label: "Mobile Engineering",
		summary:
			"iOS and Android interfaces that respect platform conventions while pushing creative boundaries.",
	},
	{
		id: "ml-research",
		label: "ML & Research",
		summary:
			"Post-training, evaluation, and systems thinking for large-scale AI products.",
	},
];

export interface ProofPillar {
	title: string;
	detail: string;
}

export const proofPillars: ProofPillar[] = [
	{
		title: "Ship the interface",
		detail:
			"Web, mobile-minded, motion-aware implementation with a quality bar closer to product than portfolio theatre.",
	},
	{
		title: "Reduce complexity cleanly",
		detail:
			"AI, finance, editorial, and internal-tool flows reduced to calm, high-signal surfaces without flattening the underlying power.",
	},
	{
		title: "Work AI-native without losing taste",
		detail:
			"Use code, prompts, prototypes, and systems thinking together, then tighten until the final surface feels intentional.",
	},
	{
		title: "Build systems, not pages",
		detail:
			"Real-time backends, admin-controlled content, and design systems that scale from 320px to 4K — this iPod included.",
	},
];

/** Contact rows for the Hire Me → Contact screen. Each deep-links out. */
export const contactLinks: PortfolioLink[] = [
	{ label: "Email", url: `mailto:${profile.email}?subject=${encodeURIComponent("Hiring — Stüssy Senik")}` },
	{ label: "LinkedIn", url: "https://www.linkedin.com/in/mxzou" },
	{ label: "GitHub", url: "https://github.com/stussysenik" },
	{ label: "X / Twitter", url: "https://x.com/mx_zou" },
];

// ─── Now ─────────────────────────────────────────────────────────────────────

export const nowLines: string[] = [
	"Shipping B2B features at Attendu (Prague).",
	"Interviewing for design engineering roles — see Hire Me.",
	"Growing @WAVELENGTH RADIO.",
	"Building this iPod portfolio — REMIX, RE-THINK, RE:IMAGINE.",
	"Studying WebGPU + computational design.",
];
