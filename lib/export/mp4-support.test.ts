import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveMp4ExportStrategy, resolveSupportedMp4EncoderConfig } from "./mp4-support";

type MockSupportResponse = {
	config?: VideoEncoderConfig;
	supported: boolean;
};

const mockIsConfigSupported = vi.fn<(config: VideoEncoderConfig) => Promise<MockSupportResponse>>();

beforeEach(() => {
	vi.stubGlobal("VideoEncoder", {
		isConfigSupported: mockIsConfigSupported,
	});
});

afterEach(() => {
	mockIsConfigSupported.mockReset();
	vi.unstubAllGlobals();
});

describe("resolveSupportedMp4EncoderConfig", () => {
	it("picks a higher AVC level when the default codec cannot encode the export size", async () => {
		mockIsConfigSupported.mockImplementation(async (config) => ({
			config,
			supported:
				config.codec === "avc1.420028" &&
				config.width === 892 &&
				config.height === 1352,
		}));

		const support = await resolveSupportedMp4EncoderConfig({
			width: 892,
			height: 1352,
			bitrate: 4_500_000,
			framerate: 24,
		});

		expect(support?.codec).toBe("avc1.420028");
		expect(mockIsConfigSupported).toHaveBeenCalled();
	});

	it("falls back to a smaller capture scale when full-resolution MP4 encoding is unavailable", async () => {
		mockIsConfigSupported.mockImplementation(async (config) => ({
			config,
			supported:
				config.codec === "avc1.420028" &&
				config.width === 380 &&
				config.height === 576,
		}));

		const strategy = await resolveMp4ExportStrategy({
			targetWidth: 446,
			targetHeight: 676,
		});

		expect(strategy?.captureScale).toBe(0.85);
		expect(strategy?.plan.captureWidth).toBe(380);
		expect(strategy?.plan.captureHeight).toBe(576);
		expect(strategy?.encoder.codec).toBe("avc1.420028");
	});
});
