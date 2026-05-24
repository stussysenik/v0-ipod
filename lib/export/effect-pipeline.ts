import { Effect, Context, Layer } from "effect";
import { 
  type ExportProgress, 
  type ExportStatus,
  detectExportCapabilities,
  createDetachedExportNode,
  preloadAndEmbedImages,
  applyAnimationFrameToClone,
  flushAnimatedCloneLayout,
  captureGifFrameCanvas,
  removeExportNode,
  downloadImageBlobWithOptions,
  summarizeBlob,
  createEncoderWorkerClient
} from "../export-utils";
import { 
  buildAnimatedExportPlan, 
  type AnimatedExportQuality, 
  type AnimatedExportLayout,
  type AnimatedExportFormat,
  MP4_QUALITY_CONFIG,
  GIF_QUALITY_CONFIG,
  MAX_GIF_FRAME_COUNT,
  MAX_MP4_FRAME_COUNT
} from "./animated-export";
import type { ThreeDIpodHandle } from "@/components/three/three-d-ipod";

// --- Types & Interfaces ---

export interface ExportOptions {
  readonly filename: string;
  readonly backgroundColor: string;
  readonly format: AnimatedExportFormat;
  readonly quality: AnimatedExportQuality;
  readonly layout: AnimatedExportLayout;
  readonly durationSeconds: number;
  readonly onProgress: (progress: ExportProgress) => void;
  readonly onStatusChange: (status: ExportStatus) => void;
  readonly threeDIpodHandle?: ThreeDIpodHandle | null;
}

export interface ExportEnv {
  readonly capabilities: ReturnType<typeof detectExportCapabilities>;
}
export const ExportEnv = Context.GenericTag<ExportEnv>("@app/ExportEnv");

export interface CaptureService {
  readonly prepareNode: (element: HTMLElement, options: { constrainedFrame: boolean }) => Effect.Effect<HTMLElement, Error>;
  readonly captureFrame: (node: HTMLElement, index: number, total: number, plan: any, backgroundColor: string, threeHandle?: ThreeDIpodHandle | null) => Effect.Effect<ImageBitmap, Error>;
  readonly cleanupNode: (node: HTMLElement | null) => Effect.Effect<void>;
}
export const CaptureService = Context.GenericTag<CaptureService>("@app/CaptureService");

// --- Implementations ---

export const ExportEnvLive = Layer.succeed(
  ExportEnv,
  ExportEnv.of({ capabilities: detectExportCapabilities() })
);

export const CaptureServiceLive = Layer.succeed(
  CaptureService,
  CaptureService.of({
    prepareNode: (element, options) => Effect.tryPromise({
      try: async () => {
        const node = createDetachedExportNode(element, options);
        await preloadAndEmbedImages(node);
        return node;
      },
      catch: (e) => new Error(`Capture preparation failed: ${e}`)
    }),
    captureFrame: (node, index, total, plan, backgroundColor, threeHandle) => Effect.tryPromise({
      try: async () => {
        // High fidelity 3D capture if handle is provided
        if (threeHandle) {
          const bitmap = await threeHandle.captureFrame(plan.captureWidth, plan.captureHeight);
          if (bitmap) return bitmap;
        }

        const elapsedMs = total === 1 ? 0 : Math.round((index / (total - 1)) * Math.max(plan.captureDurationMs - plan.frameDelayMs, 0));
        applyAnimationFrameToClone(node, elapsedMs);
        flushAnimatedCloneLayout(node);
        // Wait for paint
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        
        const canvas = await captureGifFrameCanvas(node, {
          backgroundColor,
          pixelRatio: plan.captureScale ?? 2.0,
          outputWidth: plan.captureWidth,
          outputHeight: plan.captureHeight
        });
        return await createImageBitmap(canvas);
      },
      catch: (e) => new Error(`Frame capture failed at index ${index}: ${e}`)
    }),
    cleanupNode: (node: HTMLElement | null) => Effect.sync(() => removeExportNode(node))
  })
);

/**
 * Main Export Logic wrapped in Effect
 */
export const runExportPipeline = (
  element: HTMLElement,
  options: ExportOptions
) => {
  return Effect.gen(function* (_) {
    const env = yield* _(ExportEnv);
    const capture = yield* _(CaptureService);
    
    const config = options.format === "mp4" ? MP4_QUALITY_CONFIG[options.quality] : GIF_QUALITY_CONFIG[options.quality];
    const fps = config.fps;
    const captureScale = config.scale;

    yield* _(Effect.sync(() => options.onStatusChange("preparing")));
    const exportNode = yield* _(capture.prepareNode(element, { constrainedFrame: true }));
    
    // Create worker client
    const workerClient = createEncoderWorkerClient((progress, detail) => {
      options.onProgress({
        stage: "finalizing",
        label: "Packaging high-fidelity output",
        detail,
        progress: 0.85 + progress * 0.1
      });
    });

    try {
      const plan = buildAnimatedExportPlan(
        (exportNode as HTMLElement).offsetWidth || 1,
        (exportNode as HTMLElement).offsetHeight || 1,
        {
          durationSeconds: options.durationSeconds,
          fps,
          maxFrameCount: options.format === "gif" ? MAX_GIF_FRAME_COUNT : MAX_MP4_FRAME_COUNT,
          captureScale,
          layout: options.layout
        }
      );

      // 2. Start Encoding
      yield* _(Effect.sync(() => options.onStatusChange("encoding")));
      
      const startPayload = options.format === "mp4" ? {
        type: "start-mp4" as const,
        width: plan.captureWidth,
        height: plan.captureHeight,
        frameRate: fps,
        bitrate: (config as any).bitrate ?? 12_000_000,
      } : {
        type: "start-gif" as const,
        width: plan.captureWidth,
        height: plan.captureHeight,
      };

      yield* _(Effect.tryPromise({
        try: () => workerClient.call(startPayload),
        catch: (e) => new Error(`Failed to start encoder: ${e}`)
      }));

      // 3. Capture Loop
      const frameDurationUs = Math.round(plan.frameDelayMs * 1000);
      
      for (let i = 0; i < plan.frameCount; i++) {
        const frame = yield* _(capture.captureFrame(
          exportNode, 
          i, 
          plan.frameCount, 
          { ...plan, captureScale }, 
          options.backgroundColor,
          options.threeDIpodHandle
        ));
        
        const appendPayload = options.format === "mp4" ? {
          type: "append-mp4-frame" as const,
          frameIndex: i,
          timestampUs: i * frameDurationUs,
          durationUs: frameDurationUs,
          bitmap: frame as ImageBitmap
        } : {
          type: "append-gif-frame" as const,
          frameIndex: i,
          width: plan.captureWidth,
          height: plan.captureHeight,
          delayMs: plan.frameDelayMs,
          bitmap: frame as ImageBitmap
        };

        yield* _(Effect.tryPromise({
          try: () => workerClient.call(appendPayload, [frame as ImageBitmap]),
          catch: (e) => new Error(`Failed to append frame ${i}: ${e}`)
        }));
        
        // Update progress
        const progressValue = 0.2 + ((i + 1) / plan.frameCount) * 0.65;
        yield* _(Effect.sync(() => options.onProgress({
          stage: "capturing",
          label: options.format === "mp4" ? "Encoding MP4" : "Capturing GIF",
          progress: progressValue,
          currentFrame: i + 1,
          totalFrames: plan.frameCount
        })));
      }

      // 4. Finalize
      yield* _(Effect.sync(() => options.onProgress({
        stage: "finalizing",
        label: "Packaging high-fidelity output",
        progress: 0.85
      })));
      
      const finalized = yield* _(Effect.tryPromise({
        try: () => workerClient.call({ type: "finalize" }),
        catch: (e) => new Error(`Finalization failed: ${e}`)
      }));

      if (finalized.type !== "finalized" || !finalized.buffer) {
        throw new Error("Encoder did not return a valid buffer");
      }

      const blob = new Blob([finalized.buffer], {
        type: finalized.mimeType || (options.format === "mp4" ? "video/mp4" : "image/gif")
      });

      // 5. Handoff
      yield* _(Effect.sync(() => options.onProgress({
        stage: "downloading",
        label: "Saving output",
        progress: 0.95
      })));

      const summary = yield* _(Effect.tryPromise(() => summarizeBlob(blob)));
      
      yield* _(Effect.sync(() => {
        downloadImageBlobWithOptions(blob, options.filename, {
          allowSyntheticClick: true
        });
      }));

      // 6. Success
      yield* _(Effect.sync(() => {
        options.onStatusChange("success");
        options.onProgress({
          stage: "complete",
          label: "Export complete",
          progress: 1,
          currentFrame: plan.frameCount,
          totalFrames: plan.frameCount
        });
      }));

      return { 
        success: true, 
        blobSize: summary.blobSize, 
        blobDigest: summary.blobDigest,
        error: undefined as string | undefined
      };

    } catch (error) {
       return {
         success: false,
         blobSize: 0,
         blobDigest: "",
         error: error instanceof Error ? error.message : String(error)
       };
    } finally {
      workerClient.close();
      yield* _(capture.cleanupNode(exportNode));
    }
  }).pipe(
    Effect.provide(CaptureServiceLive),
    Effect.provide(ExportEnvLive)
  );
};
