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
	location: string;
	email: string;
	edition: string;
	createdDate: string;
}

export const profile: PortfolioProfile = {
	name: 'MENGXUAN "SENIK" ZOU',
	handle: "Stüssy Senik",
	role: "DevEx & Experience Design Engineer",
	taglineJa: "クリエイティブ・テクノロジスト",
	shortBio:
		"Building at the intersection of science, design, cinema, computation and code",
	longBio:
		"Formally trained Software Engineer turned Artist & self-taught Designer with 8+ years crafting delight through impactful interfaces, experiences & artifacts. My practice applies computational techniques to augment the design & art-direction process.",
	location: "NYC / PRAGUE",
	email: "itsmxzou@gmail.com",
	edition: "01",
	createdDate: "January 2026",
};

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
	year: number;
	month?: number;
	title: string;
	description?: string;
	url?: string;
	category?: ProjectCategory;
	tools?: string[];
}

/** Newest-first; mirrors the `content.ts` works feed. */
export const projects: Project[] = [
	{
		year: 2026,
		month: 1,
		title: "iPod emulator",
		description: "A faithful, physically-accurate iPod classic in the browser.",
		url: "https://ipod-music.vercel.app",
		category: "tool",
		tools: ["JavaScript", "WebGL", "ARKit"],
	},
	{
		year: 2026,
		month: 1,
		title: "mymind.com clone",
		description: "Curate your own network — a personal mind/bookmarking tool.",
		url: "https://curate-your-own-network.stussysenik.com",
		category: "personal software",
	},
	{
		year: 2026,
		month: 1,
		title: "spinning wheel AR face filter lottery",
		url: "https://spinning-wheel-filter.vercel.app",
		category: "AR/XR",
	},
	{
		year: 2026,
		month: 1,
		title: "FYOA: Find your own answer",
		description: "An answer-engine experiment.",
		url: "https://perplexica.stussysenik.com",
		category: "music",
	},
	{
		year: 2025,
		month: 12,
		title: "typewriter that doesn't delete, or can't go back",
		description: "A writing tool that refuses the backspace.",
		url: "https://clean-writer.vercel.app",
		category: "tool",
	},
	{
		year: 2025,
		month: 12,
		title: "AR b-boy filter",
		url: "https://bboy-filter.vercel.app",
		category: "AR/XR",
	},
	{
		year: 2025,
		month: 12,
		title: "uyr-problem",
		description: "A cooking tool.",
		url: "https://uyr-problem.vercel.app",
		category: "tool",
	},
	{
		year: 2025,
		month: 12,
		title: "infinite checklist",
		url: "https://infinite-checklist.vercel.app",
		category: "tool",
	},
	{
		year: 2025,
		month: 12,
		title: "ARE YOU HAVING A CREATIVE BLOCK?",
		url: "https://creative-block.vercel.app",
		category: "art",
	},
	{
		year: 2025,
		month: 2,
		title: "DVD corner video animation",
		description: "The bouncing DVD logo, done in Three.js.",
		url: "https://dvd-video-animation.vercel.app",
		category: "technology",
		tools: ["Three.js", "WebGL"],
	},
	{
		year: 2024,
		month: 11,
		title: "PH-213 — Electricity, Current & Magnetism viz",
		description: "Concept visualizations for an E&M physics course.",
		url: "https://ph213.vercel.app",
		category: "science",
	},
	{
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
	type: "work" | "education";
	title: string;
	organization: string;
	location?: string;
	startDate: string;
	endDate: string;
	description?: string;
}

export const cv: CvEntry[] = [
	{
		type: "work",
		title: "AI/ML Growth Product Design Engineer",
		organization: "Attendu",
		location: "Prague, Czechia",
		startDate: "2026-02",
		endDate: "present",
		description:
			"Production-ready B2B features for high-trust coding scenarios; product reached #1 Product of the Day on Product Hunt (Sep 2025).",
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
		description: "Dropped out junior year to self-learn advanced CS topics.",
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

/** The four-step creative workflow that drives every project. */
export const processPhases: ProcessPhase[] = [
	{
		title: "Research",
		summary: "Gather references, constraints, and the real problem.",
		detail:
			"Start wide: collect references, talk to people, map constraints and the actual job-to-be-done. Computational tools augment the search — scraping, clustering, moodboarding — but the goal is a sharp problem statement before a single pixel.",
	},
	{
		title: "Prototype",
		summary: "Make the roughest thing that proves the idea.",
		detail:
			"Build the crudest artifact that can be felt: a clickable sketch, a shader toy, a paper cut-out. Optimize for learning per hour, not polish. Throwaway code is fine — the prototype's only job is to kill or confirm the direction.",
	},
	{
		title: "Refine",
		summary: "Tighten contour, weight, motion, and detail.",
		detail:
			"Once the idea holds, obsess over the invisible details: spacing, easing, contrast, the half-pixel. This is where craft lives — diffing against the real reference until it feels inevitable rather than designed.",
	},
	{
		title: "Ship",
		summary: "Get it in front of people; measure; iterate.",
		detail:
			"Ship to learn. Instrument it, watch real use, and treat launch as the start of the loop, not the end. Growth is the feedback signal that re-opens Research.",
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

// ─── Now ─────────────────────────────────────────────────────────────────────

export const nowLines: string[] = [
	"Shipping B2B features at Attendu (Prague).",
	"Growing @WAVELENGTH RADIO.",
	"Building this iPod portfolio.",
	"Studying WebGPU + computational design.",
];
