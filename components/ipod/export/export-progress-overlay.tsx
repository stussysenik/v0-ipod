"use client";

import { cva } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

/*
 * Ported from feat/architecture-evolution. Stages mirror the export machine's
 * states (lib/xstate/export-machine.ts) so the veil can render directly from
 * machine state — "idle" means the overlay is hidden, not a display stage.
 */
export type ExportStage =
	| "idle"
	| "preparing"
	| "capturing"
	| "encoding"
	| "finalizing"
	| "success"
	| "error";

interface ExportProgressOverlayProps {
	stage: ExportStage;
	progress: number; // 0 to 1
	error?: string | null;
	filename?: string;
	onClose: () => void;
}

const overlayVariants = cva(
	"fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-500",
	{
		variants: {
			visible: {
				true: "opacity-100 pointer-events-auto",
				false: "opacity-0 pointer-events-none",
			},
		},
	},
);

const cardVariants = cva(
	"relative w-full max-w-sm rounded-[32px] border border-white/20 bg-[#F2F1ED]/95 p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)] transition-all duration-500 transform",
	{
		variants: {
			visible: {
				true: "scale-100 translate-y-0",
				false: "scale-95 translate-y-4",
			},
		},
	},
);

const STAGE_LABELS: Record<Exclude<ExportStage, "idle">, string> = {
	preparing: "Preparing Scene",
	capturing: "Capturing Frames",
	encoding: "Encoding Media",
	finalizing: "Assembling File",
	success: "Export Complete",
	error: "Export Failed",
};

export function ExportProgressOverlay({
	stage,
	progress,
	error,
	filename,
	onClose,
}: ExportProgressOverlayProps) {
	const isVisible = stage !== "idle";
	const isSuccess = stage === "success";
	const isError = stage === "error";
	const isProcessing = isVisible && !isSuccess && !isError;

	return (
		<div className={overlayVariants({ visible: isVisible })}>
			<div className={cardVariants({ visible: isVisible })}>
				<div className="flex flex-col items-center text-center">
					<div className="mb-6 relative">
						{isProcessing && (
							<div className="relative">
								<Loader2 className="h-12 w-12 text-[#111827] animate-spin" />
								<div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
									{Math.round(progress * 100)}%
								</div>
							</div>
						)}
						{isSuccess && (
							<CheckCircle2 className="h-12 w-12 text-green-600 animate-in zoom-in duration-500" />
						)}
						{isError && (
							<AlertCircle className="h-12 w-12 text-red-600 animate-in shake duration-500" />
						)}
					</div>

					<h2 className="text-xl font-bold text-[#111827] tracking-tight">
						{stage === "idle" ? "" : STAGE_LABELS[stage]}
					</h2>

					<p className="mt-2 text-sm text-[#6B7280] font-medium max-w-[240px]">
						{isError ? error : isSuccess ? filename : `High-fidelity ${stage} in progress...`}
					</p>

					{isProcessing && (
						<div className="mt-8 w-full">
							<div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
								<div
									className="h-full bg-[#111827] transition-all duration-300 ease-out"
									style={{ width: `${progress * 100}%` }}
								/>
							</div>
							<div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
								<span>Processing</span>
								<span>{Math.round(progress * 100)}%</span>
							</div>
						</div>
					)}

					{(isSuccess || isError) && (
						<button
							type="button"
							onClick={onClose}
							className="mt-8 w-full rounded-2xl bg-[#111827] py-4 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
						>
							{isSuccess ? "Great" : "Close"}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
