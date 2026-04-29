import figma from "@figma/code-connect";

import { CarbonCheckbox } from "@/components/ui/carbon-checkbox";

figma.connect(
	CarbonCheckbox,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			checked: figma.boolean("checked"),
			disabled: figma.boolean("disabled"),
		},
		example: ({ checked, disabled }) => (
			<CarbonCheckbox checked={checked} disabled={disabled} />
		),
	},
);
