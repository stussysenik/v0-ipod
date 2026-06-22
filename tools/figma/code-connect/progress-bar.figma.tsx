import figma from "@figma/code-connect";

import { ProgressBar } from "@/components/ipod/progress-bar";

figma.connect(
	ProgressBar,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			disabled: figma.boolean("disabled"),
		},
		example: ({ disabled }) => (
			<ProgressBar
				currentTime={72}
				disabled={disabled}
				duration={264}
				onSeek={() => {}}
			/>
		),
	},
);
