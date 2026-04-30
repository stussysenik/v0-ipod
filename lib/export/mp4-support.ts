import {
	DEFAULT_MP4_EXPORT_FPS,
	MAX_MP4_FRAME_COUNT,
	MP4_BITRATE_BITS_PER_SECOND,
	MP4_CAPTURE_SCALES,
	buildAnimatedExportPlan,
	type AnimatedExportPlan,
} from "./animated-export";

const MP4_CODEC_CANDIDATES = [
	"avc1.42001F",
	"avc1.420028",
	"avc1.4d0028",
	"avc1.4d0032",
	"avc1.640028",
	"avc1.640032",
	"avc1.640033",
	"avc1.640034",
] as const;

export interface SupportedMp4EncoderConfig {
	codec: string;
	config: VideoEncoderConfig;
}

export interface Mp4EncodingProbeOptions {
	width: number;
	height: number;
	bitrate?: number;
	framerate?: number;
	codecCandidates?: readonly string[];
}

export interface Mp4ExportStrategy {
	captureScale: number;
	encoder: SupportedMp4EncoderConfig;
	plan: AnimatedExportPlan;
}

function createVideoEncoderConfig(
	options: Required<
		Pick<Mp4EncodingProbeOptions, "width" | "height" | "bitrate" | "framerate">
	>,
	codec: string,
): VideoEncoderConfig {
	return {
		codec,
		width: options.width,
		height: options.height,
		bitrate: options.bitrate,
		framerate: options.framerate,
		latencyMode: "quality",
	};
}

export async function resolveSupportedMp4EncoderConfig(
	options: Mp4EncodingProbeOptions,
): Promise<SupportedMp4EncoderConfig | null> {
	if (typeof VideoEncoder === "undefined") {
		return null;
	}

	const probe = {
		width: options.width,
		height: options.height,
		bitrate: options.bitrate ?? MP4_BITRATE_BITS_PER_SECOND,
		framerate: options.framerate ?? DEFAULT_MP4_EXPORT_FPS,
	};

	for (const candidate of options.codecCandidates ?? MP4_CODEC_CANDIDATES) {
		try {
			const support = await VideoEncoder.isConfigSupported(
				createVideoEncoderConfig(probe, candidate),
			);
			if (!support.supported) {
				continue;
			}

			return {
				codec: support.config?.codec ?? candidate,
				config: {
					...createVideoEncoderConfig(
						probe,
						support.config?.codec ?? candidate,
					),
					...support.config,
				},
			};
		} catch {
			// Keep probing other AVC profile/level candidates.
		}
	}

	return null;
}

export async function resolveMp4ExportStrategy(options: {
	durationSeconds?: number;
	fps?: number;
	targetHeight: number;
	targetWidth: number;
}): Promise<Mp4ExportStrategy | null> {
	const fps = options.fps ?? DEFAULT_MP4_EXPORT_FPS;
	for (const captureScale of MP4_CAPTURE_SCALES) {
		const plan = buildAnimatedExportPlan(options.targetWidth, options.targetHeight, {
			durationSeconds: options.durationSeconds,
			fps,
			maxFrameCount: MAX_MP4_FRAME_COUNT,
			captureScale,
		});
		const encoder = await resolveSupportedMp4EncoderConfig({
			width: plan.captureWidth,
			height: plan.captureHeight,
			bitrate: MP4_BITRATE_BITS_PER_SECOND,
			framerate: fps,
		});

		if (encoder) {
			return {
				captureScale,
				encoder,
				plan,
			};
		}
	}

	return null;
}
