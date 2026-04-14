import figma from "@figma/code-connect";

import { MarqueeText } from "@/components/ui/marquee-text";

figma.connect(
	MarqueeText,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			text: figma.string("text"),
		},
		example: ({ text }) => <MarqueeText text={text} />,
	},
);
