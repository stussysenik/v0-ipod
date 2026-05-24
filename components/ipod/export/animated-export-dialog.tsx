"use client";

import React from "react";
import { 
  Dialog, 
  DialogTrigger, 
  Heading, 
  Button, 
  Modal, 
  ModalOverlay, 
  Slider, 
  SliderTrack, 
  SliderThumb, 
  SliderOutput,
  Label,
  ToggleButtonGroup,
  ToggleButton,
  Text
} from "react-aria-components";
import { Film, Video, X, Zap, Gauge, Maximize, Square } from "lucide-react";
import { cn } from "@/lib/utils";
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
						<>
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
									className="rounded-full border border-black/5 p-2.5 text-[#111827] transition-all hover:bg-black/5 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>

							<div className="mt-8 grid grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<Label className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] px-1">Format</Label>
									<div className="flex gap-2">
										<Button
											onPress={() => onFormatChange("gif")}
											data-testid="format-gif-button"
											className={cn(
												"flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
												format === "gif" ? "bg-[#111827] text-white border-[#111827]" : "bg-white border-[#D0D4DA] text-[#6B7280] hover:bg-white/80"
											)}
										>
											<Film className="h-4 w-4" />
											GIF
										</Button>
										<Button
											isDisabled={!mp4Supported}
											onPress={() => onFormatChange("mp4")}
											data-testid="format-mp4-button"
											className={cn(
												"flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
												format === "mp4" ? "bg-[#111827] text-white border-[#111827]" : "bg-white border-[#D0D4DA] text-[#6B7280] hover:bg-white/80",
												!mp4Supported && "opacity-40 grayscale"
											)}
										>
											<Video className="h-4 w-4" />
											MP4
										</Button>
									</div>
								</div>

								<div className="flex flex-col gap-2">
									<Label className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] px-1">Canvas</Label>
									<div className="flex gap-2">
										<Button
											onPress={() => onLayoutChange("original")}
											data-testid="layout-original-button"
											className={cn(
												"flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
												layout === "original" ? "bg-[#111827] text-white border-[#111827]" : "bg-white border-[#D0D4DA] text-[#6B7280] hover:bg-white/80"
											)}
										>
											<Square className="h-4 w-4" />
											1:1
										</Button>
										<Button
											onPress={() => onLayoutChange("ig-story")}
											data-testid="layout-ig-story-button"
											className={cn(
												"flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
												layout === "ig-story" ? "bg-[#111827] text-white border-[#111827]" : "bg-white border-[#D0D4DA] text-[#6B7280] hover:bg-white/80"
											)}
										>
											<Maximize className="h-4 w-4" />
											9:16
										</Button>
									</div>
								</div>
							</div>

							<div className="mt-6 flex flex-col gap-2 p-5 rounded-[28px] bg-white/60 border border-black/5 backdrop-blur-sm">
								<Label className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Quality Profile</Label>
								<div className="flex gap-2 mt-2">
									<Button
										onPress={() => onQualityChange("standard")}
										data-testid="quality-standard-button"
										className={cn(
											"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all outline-none",
											quality === "standard" ? "bg-white border-[#111827] shadow-sm text-[#111827]" : "bg-transparent border-transparent text-[#6B7280] hover:bg-black/5"
										)}
									>
										<Gauge className="h-3.5 w-3.5" />
										Standard
									</Button>
									<Button
										onPress={() => onQualityChange("pro")}
										data-testid="quality-pro-button"
										className={cn(
											"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all outline-none",
											quality === "pro" ? "bg-white border-[#111827] shadow-sm text-[#111827]" : "bg-transparent border-transparent text-[#6B7280] hover:bg-black/5"
										)}
									>
										<Zap className="h-3.5 w-3.5" />
										Ultra Fidelity (50Mbps)
									</Button>
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
											<Label className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Capture Duration</Label>
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
													className="absolute h-full rounded-full bg-[#111827]" 
													style={{ width: `${state.getThumbPercent(0) * 100}%` }} 
												/>
												<SliderThumb className="h-5 w-5 rounded-full bg-white border-2 border-[#111827] shadow-md outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 transition-shadow top-1/2" />
											</>
										)}
									</SliderTrack>
								</Slider>
							</div>

							<div className="mt-10 flex items-center gap-3">
								<Button
									onPress={close}
									data-testid="dialog-cancel-button"
									className="flex-1 py-4 rounded-2xl border border-[#D0D4DA] bg-white text-sm font-bold text-[#111827] hover:bg-black/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
								>
									Cancel
								</Button>
								<Button
									onPress={onConfirm}
									data-testid="start-rendering-button"
									className="flex-1 py-4 rounded-2xl bg-[#111827] text-sm font-bold text-white hover:bg-black transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
								>
									Start Rendering
								</Button>
							</div>
						</>
					)}
				</Dialog>
			</Modal>
		</ModalOverlay>
	);
}
