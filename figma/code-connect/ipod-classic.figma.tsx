import figma from "@figma/code-connect";

import IPodClassic from "@/components/ipod/ipod-classic";

figma.connect(
	IPodClassic,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		example: () => <IPodClassic />,
	},
);
