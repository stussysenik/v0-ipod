import {
	defineConfig,
	presetUno,
	presetAttributify,
	presetIcons,
	presetTypography,
	transformerDirectives,
	transformerVariantGroup,
} from "unocss";

export default defineConfig({
	shortcuts: [
		["flex-center", "flex items-center justify-center"],
		["stack", "flex flex-col"],
	],
	presets: [
		presetUno(), // Includes Tachyons support
		presetAttributify(),
		presetIcons({
			scale: 1.2,
		}),
		presetTypography(),
	],
	transformers: [transformerDirectives(), transformerVariantGroup()],
});
