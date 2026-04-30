"use client";

import { Film, Video, X } from "lucide-react";
import type { AnimatedExportFormat } from "@/lib/export/animated-export";
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
	currentTimeLabel: string;
	mp4Supported: boolean;
	onClose: () => void;
	onDurationChange: (value: number) => void;
	onFormatChange: (format: AnimatedExportFormat) => void;
	onConfirm: () => void;
}

export function AnimatedExportDialog({
	open,
	format,
	durationSeconds,
	currentTimeLabel,
	mp4Supported,
	onClose,
	onDurationChange,
	onFormatChange,
	onConfirm,
}: AnimatedExportDialogProps) {
	if (!open) {
		return null;
	}

	const safeDuration = clampAnimatedExportDurationSeconds(
		durationSeconds || DEFAULT_ANIMATED_EXPORT_DURATION_SECONDS,
	);

	return (
		<div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
			<div className="w-full max-w-lg rounded-[28px] border border-white/25 bg-[#F2F1ED] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
							Animated Export
						</p>
						<h2 className="mt-1 text-xl font-semibold text-[#111827]">
							Start from the live screen state
						</h2>
						<p className="mt-2 text-sm leading-6 text-[#4B5563]">
							The export begins at{" "}
							<span className="font-semibold text-[#111827]">
								{currentTimeLabel}
							</span>{" "}
							and continues the title marquee plus
							playback bar from there.
						</p>
					</div>
					<button
						aria-label="Close animated export dialog"
						className="rounded-full border border-black/10 p-2 text-[#111827] transition-colors hover:bg-black/5"
						type="button"
						onClick={onClose}
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				<div className="mt-4 grid grid-cols-2 gap-2">
					<button
						type="button"
						onClick={() => onFormatChange("gif")}
						className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
							format === "gif"
								? "border-[#111827] bg-[#111827] text-white"
								: "border-[#D1D5DB] bg-white text-[#111827] hover:bg-[#F9FAFB]"
						}`}
					>
						<Film className="h-4 w-4" />
						`.gif`
					</button>
					<button
						type="button"
						onClick={() => {
							if (mp4Supported) {
								onFormatChange("mp4");
							}
						}}
						className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
							format === "mp4"
								? "border-[#111827] bg-[#111827] text-white"
								: "border-[#D1D5DB] bg-white text-[#111827] hover:bg-[#F9FAFB]"
						} ${mp4Supported ? "" : "cursor-not-allowed opacity-50"}`}
						disabled={!mp4Supported}
					>
						<Video className="h-4 w-4" />
						`.mp4`
					</button>
				</div>

				<div className="mt-4 rounded-[24px] border border-black/10 bg-white/85 p-4">
					<div className="flex items-end justify-between gap-4">
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
								Duration
							</p>
							<p className="mt-1 text-sm text-[#374151]">
								Choose roughly how long the exported
								loop should run.
							</p>
						</div>
						<div className="text-right">
							<div className="text-3xl font-semibold leading-none text-[#111827]">
								{safeDuration}
							</div>
							<div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
								seconds
							</div>
						</div>
					</div>

					<input
						type="range"
						min={MIN_ANIMATED_EXPORT_DURATION_SECONDS}
						max={MAX_ANIMATED_EXPORT_DURATION_SECONDS}
						step={1}
						value={safeDuration}
						onChange={(event) =>
							onDurationChange(Number(event.target.value))
						}
						className="mt-4 w-full"
					/>

					<div className="mt-3 flex items-center justify-between gap-3">
						<input
							type="number"
							min={MIN_ANIMATED_EXPORT_DURATION_SECONDS}
							max={MAX_ANIMATED_EXPORT_DURATION_SECONDS}
							step={1}
							value={safeDuration}
							onChange={(event) =>
								onDurationChange(
									Number(event.target.value),
								)
							}
							className="w-24 rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-semibold text-[#111827] outline-none"
						/>
						<p className="text-right text-xs leading-5 text-[#6B7280]">
							{format === "gif"
								? "GIF keeps file size lower but uses fewer colors."
								: mp4Supported
									? "MP4 uses H.264 for a cleaner, more portable export."
									: "MP4 needs a browser with WebCodecs + OffscreenCanvas support."}
						</p>
					</div>
				</div>

				<div className="mt-4 flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-2xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#F9FAFB]"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="rounded-2xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1F2937]"
					>
						Export {format === "gif" ? ".gif" : ".mp4"}
					</button>
				</div>
			</div>
		</div>
	);
}
