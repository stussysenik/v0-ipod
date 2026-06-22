import figma from "@figma/code-connect";

import { ClickWheel } from "@/components/ipod/click-wheel";
import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";

const preset = getIpodClassicPreset("classic-2008-black");

figma.connect(
	ClickWheel,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			skinColor: figma.string("skinColor"),
			disabled: figma.boolean("disabled"),
			exportSafe: figma.boolean("exportSafe"),
		},
		example: ({ skinColor, disabled, exportSafe }) => (
			<ClickWheel
				disabled={disabled}
				exportSafe={exportSafe}
				playClick={() => {}}
				preset={preset}
				skinColor={skinColor}
				onSeek={() => {}}
			/>
		),
	},
);
