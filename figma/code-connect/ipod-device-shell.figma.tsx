import figma from "@figma/code-connect";

import { IPodDeviceShell } from "@/components/ipod/ipod-device-shell";

figma.connect(
	IPodDeviceShell,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			skinColor: figma.string("skinColor"),
			exportSafe: figma.boolean("exportSafe"),
		},
		example: ({ skinColor, exportSafe }) => (
			<IPodDeviceShell
				exportSafe={exportSafe}
				screen={<div />}
				skinColor={skinColor}
				wheel={<div />}
			/>
		),
	},
);
