import figma from "@figma/code-connect";

import { IpodScreen } from "@/components/ipod/ipod-screen";
import { getIpodClassicPreset } from "@/lib/ipod-classic-presets";

const preset = getIpodClassicPreset("classic-2008-black");
const fallbackState = {
	title: "Such Great Heights",
	artist: "The Postal Service",
	album: "Give Up",
	artwork: "",
	duration: 264,
	currentTime: 72,
	rating: 4,
	trackNumber: 3,
	totalTracks: 10,
};

figma.connect(
	IpodScreen,
	"https://www.figma.com/design/PLACEHOLDER_FILE_KEY/iPod-Dev-Mode-Bridge?node-id=0%3A1",
	{
		props: {
			interactionModel: figma.enum("interactionModel", {
				direct: "direct",
				"ipod-os": "ipod-os",
			}),
			osScreen: figma.enum("osScreen", {
				menu: "menu",
				"now-playing": "now-playing",
			}),
		},
		example: ({ interactionModel, osScreen }) => (
			<IpodScreen
				dispatch={() => {}}
				interactionModel={interactionModel}
				isEditable={false}
				osScreen={osScreen}
				playClick={() => {}}
				preset={preset}
				state={fallbackState}
			/>
		),
	},
);
