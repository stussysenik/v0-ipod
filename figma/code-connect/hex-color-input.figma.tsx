import figma from "@figma/code-connect";

import { HexColorInput } from "@/components/ipod/hex-color-input";

figma.connect(
	HexColorInput,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			value: figma.string("value"),
		},
		example: ({ value }) => <HexColorInput value={value} onChange={() => {}} />,
	},
);
