import figma from "@figma/code-connect";

import { EditableTrackNumber } from "@/components/ipod/editable-track-number";

figma.connect(
	EditableTrackNumber,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		example: () => (
			<EditableTrackNumber
				totalTracks={10}
				trackNumber={3}
				onTotalTracksChange={() => {}}
				onTrackNumberChange={() => {}}
			/>
		),
	},
);
