import figma from "@figma/code-connect";

import { EditableDuration } from "@/components/ipod/editable-duration";

figma.connect(
	EditableDuration,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		example: () => <EditableDuration value={264} onChange={() => {}} />,
	},
);
