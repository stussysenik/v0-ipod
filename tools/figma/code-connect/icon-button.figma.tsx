import figma from "@figma/code-connect";
import { Camera } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";

figma.connect(
	IconButton,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			label: figma.string("label"),
			isActive: figma.boolean("isActive"),
			contrast: figma.boolean("contrast"),
		},
		example: ({ label, isActive, contrast }) => (
			<IconButton
				contrast={contrast}
				icon={<Camera className="h-5 w-5" />}
				isActive={isActive}
				label={label}
			/>
		),
	},
);
