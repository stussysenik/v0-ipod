import { defineConfig, presetWind3, presetIcons } from "unocss";

// Shadow-DOM mode: CSS is injected directly into the Lit element's static styles
// via @unocss-placeholder so utilities resolve inside the shadow root without
// any global stylesheet dependency.
export default defineConfig({
	presets: [presetWind3(), presetIcons({ scale: 1.2 })],
	content: {
		pipeline: {
			include: [/packages\/ipod-wc\/src\/.*\.(ts|html)($|\?)/],
			exclude: ["node_modules", ".git", "dist"],
		},
	},
	// The WC ships standalone; no theme tokens needed (the embed reads --ipod-* vars
	// from the host page via CSS custom property inheritance through :host).
});
