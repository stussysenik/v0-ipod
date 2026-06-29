"use client";

import {
  Dialog,
  Heading,
  Button,
  Modal,
  ModalOverlay,
  Slider,
  SliderTrack,
  SliderThumb,
  SliderOutput,
  Text
} from "react-aria-components";
import { Film, Video, X, Zap, Gauge, Maximize, Square } from "lucide-react";
import { StudioButton, StudioControlScope, StudioLabel } from "@/components/ui/studio-controls";
import type {
	AnimatedExportFormat,
	AnimatedExportQuality,
	AnimatedExportLayout,
} from "@/lib/export/animated-export";
import {
	DEFAULT_ANIMATED_EXPORT_DURATION_SECONDS,
	MAX_ANIMATED_EXPORT_DURATION_SECONDS,
	MIN_ANIMATED_EXPORT_DURATION_SECONDS,
	clampAnimatedExportDurationSeconds,
} from "@/lib/export/animated-export";

interface AnimatedExportDialogProps {
	open: boolean;
	format: AnimatedExportFormat;
	durationSeconds: number;
	quality: AnimatedExportQuality;
	layout: AnimatedExportLayout;
	currentTimeLabel: string;
	mp4Supported: boolean;
	onClose: () => void;
	onDurationChange: (value: number) => void;
	onFormatChange: (format: AnimatedExportFormat) => void;
	onQualityChange: (quality: AnimatedExportQuality) => void;
	onLayoutChange: (layout: AnimatedExportLayout) => void;
	onConfirm: () => void;
}

export function AnimatedExportDialog({
	open,
	format,
	durationSeconds,
	quality,
	layout,
	currentTimeLabel,
	mp4Supported,
	onClose,
	onDurationChange,
	onFormatChange,
	onQualityChange,
	onLayoutChange,
	onConfirm,
}: AnimatedExportDialogProps) {
	const safeDuration = clampAnimatedExportDurationSeconds(
		durationSeconds || DEFAULT_ANIMATED_EXPORT_DURATION_SECONDS,
	);

	return (
		<ModalOverlay
			isOpen={open}
			onOpenChange={(isOpen) => !isOpen && onClose()}
			className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm"
		>
			<Modal className="w-full max-w-lg rounded-[32px] border border-white/25 bg-[#F2F1ED] p-7 shadow-[0_40px_100px_rgba(0,0,0,0.45)] outline-none animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
				<Dialog className="outline-none">
					{({ close }) => (
						<StudioControlScope stageBackground="#F2F1ED">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B7280]">
										Studio Capture
									</p>
									<Heading slot="title" className="mt-2 text-2xl font-bold text-[#111827] tracking-tight">
										Record sequence
									</Heading>
									<Text slot="description" className="mt-3 text-sm leading-relaxed text-[#4B5563]">
										Capturing high-fidelity physical assembly snapshot starting at{" "}
										<span className="font-bold text-[#111827]">
											{currentTimeLabel}
										</span>.
									</Text>
								</div>
								<Button
									onPress={close}
									data-testid="dialog-close-button"
									className="rounded-full border border-black/5 p-2.5 text-[#111827] transition-all hover:bg-black/5 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--studio-focus-ring)]"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>

							<div className="mt-8 grid grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<StudioLabel className="tracking-widest px-1">Format</StudioLabel>
									<div className="flex gap-2">
										<StudioButton
											size="md"
											isActive={format === "gif"}
											onPress={() => onFormatChange("gif")}
											data-testid="format-gif-button"
										>
											<Film className="h-4 w-4" />
											GIF
										</StudioButton>
										<StudioButton
											size="md"
											isActive={format === "mp4"}
											isDisabled={!mp4Supported}
											onPress={() => onFormatChange("mp4")}
											data-testid="format-mp4-button"
											className={mp4Supported ? undefined : "grayscale"}
										>
											<Video className="h-4 w-4" />
											MP4
										</StudioButton>
									</div>
								</div>

								<div className="flex flex-col gap-2">
									<StudioLabel className="tracking-widest px-1">Canvas</StudioLabel>
									<div className="flex gap-2">
										<StudioButton
											size="md"
											isActive={layout === "original"}
											onPress={() => onLayoutChange("original")}
											data-testid="layout-original-button"
										>
											<Square className="h-4 w-4" />
											1:1
										</StudioButton>
										<StudioButton
											size="md"
											isActive={layout === "ig-story"}
											onPress={() => onLayoutChange("ig-story")}
											data-testid="layout-ig-story-button"
										>
											<Maximize className="h-4 w-4" />
											9:16
										</StudioButton>
									</div>
								</div>
							</div>

							<div className="mt-6 flex flex-col gap-2 p-5 rounded-[28px] bg-white/60 border border-black/5 backdrop-blur-sm">
								<StudioLabel className="tracking-widest">Quality Profile</StudioLabel>
								<div className="flex gap-2 mt-2">
									<StudioButton
										isActive={quality === "standard"}
										onPress={() => onQualityChange("standard")}
										data-testid="quality-standard-button"
									>
										<Gauge className="h-3.5 w-3.5" />
										Standard
									</StudioButton>
									<StudioButton
										isActive={quality === "pro"}
										onPress={() => onQualityChange("pro")}
										data-testid="quality-pro-button"
									>
										<Zap className="h-3.5 w-3.5" />
										Ultra Fidelity (50Mbps)
									</StudioButton>
								</div>
							</div>

							<div className="mt-6 p-6 rounded-[28px] bg-white/60 border border-black/5 backdrop-blur-sm">
								<Slider
									value={safeDuration}
									onChange={(val) => onDurationChange(val as number)}
									minValue={MIN_ANIMATED_EXPORT_DURATION_SECONDS}
									maxValue={MAX_ANIMATED_EXPORT_DURATION_SECONDS}
									step={1}
									className="flex flex-col gap-4"
								>
									<div className="flex items-end justify-between">
										<div className="flex flex-col gap-1">
											<StudioLabel className="tracking-widest">Capture Duration</StudioLabel>
											<Text className="text-[10px] text-[#6B7280]">Max 60s interaction loop</Text>
										</div>
										<SliderOutput className="text-3xl font-bold tabular-nums text-[#111827]">
											{({state}) => (
                        <>
                          {state.getThumbValue(0)}
                          <span className="ml-1.5 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">sec</span>
                        </>
                      )}
										</SliderOutput>
									</div>
									<SliderTrack className="relative h-2 w-full rounded-full bg-black/10">
										{({state}) => (
											<>
												<div
													className="absolute h-full rounded-full bg-[color:var(--studio-accent)]"
													style={{ width: `${state.getThumbPercent(0) * 100}%` }}
												/>
												<SliderThumb className="h-5 w-5 rounded-full bg-white border-2 border-[color:var(--studio-accent)] shadow-md outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--studio-focus-ring)]/30 transition-shadow top-1/2" />
											</>
										)}
									</SliderTrack>
								</Slider>
							</div>

							<div className="mt-10 flex items-center gap-3">
								<StudioButton
									size="md"
									fullWidth
									variant="secondary"
									onPress={close}
									data-testid="dialog-cancel-button"
								>
									Cancel
								</StudioButton>
								<StudioButton
									size="md"
									fullWidth
									variant="primary"
									onPress={onConfirm}
									data-testid="start-rendering-button"
								>
									Start Rendering
								</StudioButton>
							</div>
						</StudioControlScope>
					)}
				</Dialog>
			</Modal>
		</ModalOverlay>
	);
}
