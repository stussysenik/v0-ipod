import figma from "@figma/code-connect";

import { EditableText } from "@/components/ipod/editable-text";

figma.connect(
	EditableText,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			value: figma.string("value"),
			disabled: figma.boolean("disabled"),
		},
		example: ({ value, disabled }) => (
			<EditableText disabled={disabled} value={value} onChange={() => {}} />
		),
	},
);
