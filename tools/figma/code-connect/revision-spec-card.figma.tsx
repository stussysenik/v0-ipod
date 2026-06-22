import figma from "@figma/code-connect";

import { RevisionSpecCard } from "@/components/ipod/revision-spec-card";

figma.connect(
	RevisionSpecCard,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			presetId: figma.enum("presetId", {
				"classic-2008-black": "classic-2008-black",
				"classic-2008-silver": "classic-2008-silver",
				"classic-2007": "classic-2007",
				"classic-2009": "classic-2009",
			}),
		},
		example: ({ presetId }) => <RevisionSpecCard presetId={presetId} />,
	},
);
