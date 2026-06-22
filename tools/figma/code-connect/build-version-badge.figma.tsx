import figma from "@figma/code-connect";

import { BuildVersionBadge } from "@/components/build-version-badge";

figma.connect(
	BuildVersionBadge,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			initialVersion: figma.string("initialVersion"),
		},
		example: ({ initialVersion }) => (
			<BuildVersionBadge initialVersion={initialVersion} />
		),
	},
);
