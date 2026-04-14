import figma from "@figma/code-connect";

import { ThemeToggle } from "@/components/ui/theme-toggle";

figma.connect(
	ThemeToggle,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			theme: figma.enum("theme", { black: "black", white: "white" }),
			showLabel: figma.boolean("showLabel"),
		},
		example: ({ theme, showLabel }) => (
			<ThemeToggle showLabel={showLabel} theme={theme} onToggle={() => {}} />
		),
	},
);
