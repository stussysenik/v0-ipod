import figma from "@figma/code-connect";

import { Switch } from "@/components/ui/switch";

figma.connect(
	Switch,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			checked: figma.boolean("checked"),
			disabled: figma.boolean("disabled"),
		},
		example: ({ checked, disabled }) => (
			<Switch checked={checked} disabled={disabled} />
		),
	},
);
