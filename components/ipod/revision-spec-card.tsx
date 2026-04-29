"use client";

import { getRevisionSpec } from "@/lib/ipod-revision-data";

import type { IpodHardwarePresetId } from "@/types/ipod-state";

interface RevisionSpecCardProps {
	presetId: IpodHardwarePresetId;
}

export function RevisionSpecCard({ presetId }: RevisionSpecCardProps) {
	const spec = getRevisionSpec(presetId);
	if (!spec) return null;

	const rows = [
		{ label: "SoC", value: spec.soC },
		{ label: "Storage", value: spec.storage },
		{ label: "RAM", value: spec.ram },
		{ label: "Display", value: spec.display },
		{ label: "Audio", value: spec.audioCodec },
		{ label: "Battery", value: spec.battery },
		{ label: "OS", value: `${spec.initialOs} → ${spec.finalOs}` },
		{ label: "Dimensions", value: spec.dimensions },
	];

	return (
		<div
			className="mt-4 pt-4 border-t border-[#E0E0E0]"
			data-testid="revision-spec-card"
		>
			<h4 className="text-[10px] font-semibold text-[#161616] uppercase tracking-[0.08em] mb-2">
				{spec.model}
			</h4>
			<p className="text-[10px] leading-[1.45] text-[#525252] mb-3">
				{spec.designNotes}
			</p>
			<div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
				{rows.map((row) => (
					<div key={row.label} className="min-w-0">
						<div className="text-[9px] font-semibold text-[#8D8D8D] uppercase tracking-[0.06em]">
							{row.label}
						</div>
						<div
							className="text-[10px] font-medium text-[#161616] truncate"
							title={row.value}
						>
							{row.value}
						</div>
					</div>
				))}
			</div>
			<div className="mt-3 text-[9px] text-[#A8A8A8]">
				Sources: {spec.sources.join(", ")}
			</div>
		</div>
	);
}
