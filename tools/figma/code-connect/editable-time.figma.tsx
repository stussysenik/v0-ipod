import figma from "@figma/code-connect";

import { EditableTime } from "@/components/ipod/editable-time";

figma.connect(
	EditableTime,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			isRemaining: figma.boolean("isRemaining"),
			disabled: figma.boolean("disabled"),
		},
		example: ({ isRemaining, disabled }) => (
			<EditableTime
				disabled={disabled}
				isRemaining={isRemaining}
				value={72}
				onChange={() => {}}
			/>
		),
	},
);
