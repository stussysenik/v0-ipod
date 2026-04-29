import figma from "@figma/code-connect";

import { ScreenBattery } from "@/components/ipod/screen-battery";

figma.connect(
	ScreenBattery,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		example: () => <ScreenBattery level={0.72} />,
	},
);
