import figma from "@figma/code-connect";

import { StarRating } from "@/components/ipod/star-rating";

figma.connect(
	StarRating,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		example: () => <StarRating rating={4} onChange={() => {}} />,
	},
);
