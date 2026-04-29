import figma from "@figma/code-connect";

import { GreyPalettePicker } from "@/components/ipod/grey-palette-picker";

const oklchStub = (l: number) =>
	`#${Math.round(l * 255)
		.toString(16)
		.padStart(2, "0")
		.repeat(3)
		.toUpperCase()}`;

figma.connect(
	GreyPalettePicker,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			target: figma.enum("target", { case: "case", bg: "bg" }),
			currentColor: figma.string("currentColor"),
		},
		example: ({ target, currentColor }) => (
			<GreyPalettePicker
				oklchReady
				currentColor={currentColor}
				oklchToHex={oklchStub}
				target={target}
				onColorCommit={() => {}}
				onColorSelect={() => {}}
			/>
		),
	},
);
