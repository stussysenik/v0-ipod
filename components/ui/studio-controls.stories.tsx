import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, within } from "storybook/test";

import {
	StudioButton,
	StudioChip,
	StudioControlScope,
	StudioField,
	StudioLabel,
	StudioRow,
	StudioSegment,
} from "./studio-controls";

/**
 * Gallery of the precision-instrument primitives, solved against a chosen stage color.
 * Switch the `stageBackground` arg to watch every token re-solve while staying legible.
 */
function ControlGallery({ stageBackground }: { stageBackground: string }) {
	const [finish, setFinish] = useState<"black" | "white">("black");
	const [mode, setMode] = useState<"direct" | "ipod-os">("direct");
	const [swatch, setSwatch] = useState("#0048FF");

	return (
		<div style={{ background: stageBackground, padding: 32, minHeight: 360 }}>
			<StudioControlScope
				stageBackground={stageBackground}
				className="mx-auto flex max-w-xs flex-col gap-5 rounded-2xl p-5"
				style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
			>
				<div className="flex flex-col gap-2">
					<StudioLabel>Case Finish</StudioLabel>
					<StudioSegment
						aria-label="Case finish"
						value={finish}
						onChange={setFinish}
						options={[
							{ value: "black", label: "Jet Black" },
							{ value: "white", label: "Classic White" },
						]}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<StudioLabel>Control Interface</StudioLabel>
					<StudioSegment
						aria-label="Control interface"
						value={mode}
						onChange={setMode}
						options={[
							{ value: "direct", label: "Direct Edit" },
							{ value: "ipod-os", label: "iPod OS" },
						]}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<StudioLabel>Recent Custom</StudioLabel>
					<div className="flex gap-2.5">
						{["#0048FF", "#FF3B30", "#34C759", "#FFCC00"].map((c) => (
							<StudioChip
								key={c}
								color={c}
								label={c}
								isSelected={swatch === c}
								onPress={() => setSwatch(c)}
							/>
						))}
					</div>
				</div>

				<StudioRow label="Active">
					<StudioField>{swatch}</StudioField>
				</StudioRow>

				<div className="flex gap-3">
					<StudioButton variant="secondary">Restore</StudioButton>
					<StudioButton variant="primary">Snapshot</StudioButton>
				</div>
			</StudioControlScope>
		</div>
	);
}

const meta = {
	title: "components/ui/StudioControls",
	component: ControlGallery,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Precision-instrument control language. Colors are solved deterministically against the active stage background; selection is a solid fill; behavior is React Aria.",
			},
		},
	},
	args: { stageBackground: "#FFFFFF" },
	argTypes: { stageBackground: { control: "color" } },
} satisfies Meta<typeof ControlGallery>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LightStage: Story = { args: { stageBackground: "#FFFFFF" } };
export const BlueStage: Story = { args: { stageBackground: "#0048FF" } };
export const MidStage: Story = { args: { stageBackground: "#808080" } };
export const DarkStage: Story = { args: { stageBackground: "#1B1818" } };

export const Interactive: Story = {
	args: { stageBackground: "#0048FF" },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const segment = canvas.getByRole("button", { name: "Classic White" });
		await expect(segment).toBeInTheDocument();
		await expect(canvas.getByText("Snapshot")).toBeInTheDocument();
	},
};
