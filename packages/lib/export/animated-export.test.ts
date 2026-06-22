import { describe, expect, it } from "vitest";

import {
	buildAnimatedExportPlan,
	clampAnimatedExportDurationSeconds,
	GIF_QUALITY_CONFIG,
	MAX_ANIMATED_EXPORT_DURATION_SECONDS,
	MAX_MP4_FRAME_COUNT,
	MP4_QUALITY_CONFIG,
} from "./animated-export";

/**
 * Guards for the export-quality envelope. The existing standard/pro tiers and the
 * 1.5× capture-scale plan math are pinned by mp4-support.test; here we pin the new
 * "cinema" tier, the raised duration ceiling, and motion-blur plumbing — and that
 * the legacy tiers are untouched.
 */
describe("export quality tiers", () => {
	it("keeps the legacy standard/pro MP4 tiers unchanged", () => {
		expect(MP4_QUALITY_CONFIG.standard.fps).toBe(12);
		expect(MP4_QUALITY_CONFIG.pro.fps).toBe(30);
	});

	it("adds a 60fps cinema MP4 tier with a higher bitrate", () => {
		expect(MP4_QUALITY_CONFIG.cinema.fps).toBe(60);
		expect(MP4_QUALITY_CONFIG.cinema.bitrate).toBeGreaterThan(MP4_QUALITY_CONFIG.pro.bitrate);
	});

	it("adds a cinema GIF tier", () => {
		expect(GIF_QUALITY_CONFIG.cinema).toBeDefined();
		expect(GIF_QUALITY_CONFIG.cinema.fps).toBeGreaterThanOrEqual(GIF_QUALITY_CONFIG.pro.fps);
	});

	it("raises the duration ceiling for long exports", () => {
		expect(MAX_ANIMATED_EXPORT_DURATION_SECONDS).toBeGreaterThanOrEqual(120);
		expect(clampAnimatedExportDurationSeconds(120)).toBe(120);
	});

	it("lets the MP4 frame budget cover a long 60fps clip", () => {
		expect(MAX_MP4_FRAME_COUNT).toBeGreaterThanOrEqual(120 * 60);
	});
});

describe("buildAnimatedExportPlan motion blur", () => {
	it("defaults to no motion blur", () => {
		const plan = buildAnimatedExportPlan(100, 100, {
			durationSeconds: 2,
			fps: 30,
			maxFrameCount: MAX_MP4_FRAME_COUNT,
			captureScale: 1,
		});
		expect(plan.motionBlurSamples).toBe(1);
	});

	it("carries motion-blur sampling into the plan", () => {
		const plan = buildAnimatedExportPlan(100, 100, {
			durationSeconds: 2,
			fps: 60,
			maxFrameCount: MAX_MP4_FRAME_COUNT,
			captureScale: 1,
			motionBlurSamples: 4,
			shutterAngle: 180,
		});
		expect(plan.motionBlurSamples).toBe(4);
		expect(plan.shutterAngle).toBe(180);
	});

	it("plans a long 60fps clip without exceeding the frame cap", () => {
		const plan = buildAnimatedExportPlan(100, 100, {
			durationSeconds: 120,
			fps: 60,
			maxFrameCount: MAX_MP4_FRAME_COUNT,
			captureScale: 1,
		});
		expect(plan.frameCount).toBe(Math.min(MAX_MP4_FRAME_COUNT, 120 * 60));
	});
});
