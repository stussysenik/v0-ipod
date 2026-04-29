import figma from "@figma/code-connect";

import { Checkbox } from "@/components/ui/checkbox";

figma.connect(
	Checkbox,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			checked: figma.boolean("checked"),
			disabled: figma.boolean("disabled"),
		},
		example: ({ checked, disabled }) => (
			<Checkbox checked={checked} disabled={disabled} />
		),
	},
);
