import { addons } from "@storybook/manager-api";

addons.setConfig({
	sidebar: {
		showRoots: true,
		collapsedRoots: ["tokens", "docs"],
	},
	toolbar: {
		title: { hidden: false },
		zoom: { hidden: false },
		eject: { hidden: true },
		copy: { hidden: true },
		fullscreen: { hidden: false },
	},
});
