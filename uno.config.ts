import {
	defineConfig,
	presetWind3,
	presetIcons,
	presetTypography,
	transformerVariantGroup,
} from "unocss";

// shadcn/ui CSS-variable token theme — mirrors the CSS custom properties in
// app/globals.css so that utility classes like bg-background, text-muted-foreground,
// border-border etc. resolve correctly once Tailwind is removed.
const shadcnColors = {
	background: "hsl(var(--background))",
	foreground: "hsl(var(--foreground))",
	card: {
		DEFAULT: "hsl(var(--card))",
		foreground: "hsl(var(--card-foreground))",
	},
	popover: {
		DEFAULT: "hsl(var(--popover))",
		foreground: "hsl(var(--popover-foreground))",
	},
	primary: {
		DEFAULT: "hsl(var(--primary))",
		foreground: "hsl(var(--primary-foreground))",
	},
	secondary: {
		DEFAULT: "hsl(var(--secondary))",
		foreground: "hsl(var(--secondary-foreground))",
	},
	muted: {
		DEFAULT: "hsl(var(--muted))",
		foreground: "hsl(var(--muted-foreground))",
	},
	accent: {
		DEFAULT: "hsl(var(--accent))",
		foreground: "hsl(var(--accent-foreground))",
	},
	destructive: {
		DEFAULT: "hsl(var(--destructive))",
		foreground: "hsl(var(--destructive-foreground))",
	},
	border: "hsl(var(--border))",
	input: "hsl(var(--input))",
	ring: "hsl(var(--ring))",
	"chart-1": "hsl(var(--chart-1))",
	"chart-2": "hsl(var(--chart-2))",
	"chart-3": "hsl(var(--chart-3))",
	"chart-4": "hsl(var(--chart-4))",
	"chart-5": "hsl(var(--chart-5))",
	sidebar: {
		DEFAULT: "hsl(var(--sidebar-background))",
		foreground: "hsl(var(--sidebar-foreground))",
		primary: {
			DEFAULT: "hsl(var(--sidebar-primary))",
			foreground: "hsl(var(--sidebar-primary-foreground))",
		},
		accent: {
			DEFAULT: "hsl(var(--sidebar-accent))",
			foreground: "hsl(var(--sidebar-accent-foreground))",
		},
		border: "hsl(var(--sidebar-border))",
		ring: "hsl(var(--sidebar-ring))",
	},
};

export default defineConfig({
	content: {
		pipeline: {
			include: [/\.(tsx|ts|jsx|js|html)($|\?)/],
			exclude: ["node_modules", ".git", ".next"],
		},
	},
	theme: {
		colors: shadcnColors,
		borderRadius: {
			lg: "var(--radius)",
			md: "calc(var(--radius) - 2px)",
			sm: "calc(var(--radius) - 4px)",
		},
	},
	preflights: [
		{
			getCSS: () => `
@keyframes enter {
  from {
    opacity: var(--un-enter-opacity, 1);
    transform:
      translate3d(var(--un-enter-translate-x, 0), var(--un-enter-translate-y, 0), 0)
      scale3d(var(--un-enter-scale, 1), var(--un-enter-scale, 1), var(--un-enter-scale, 1))
      rotate(var(--un-enter-rotate, 0));
  }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}`,
		},
	],
	shortcuts: [
		["flex-center", "flex items-center justify-center"],
		["stack", "flex flex-col"],
		// animate-in fill-mode-both: animation already includes fill-mode=both in the rule
		["fill-mode-both", "![animation-fill-mode:both]"],
	],
	rules: [
		[
			"animate-in",
			{
				"--un-enter-opacity": "initial",
				"--un-enter-translate-x": "initial",
				"--un-enter-translate-y": "initial",
				"--un-enter-rotate": "initial",
				"--un-enter-scale": "initial",
				"animation-name": "enter",
				"animation-duration": "var(--un-animate-duration, 150ms)",
				"animation-timing-function": "ease",
				"animation-fill-mode": "both",
			},
		],
		["fade-in", { "--un-enter-opacity": "0" }],
		["zoom-in", { "--un-enter-scale": "0" }],
		["zoom-in-95", { "--un-enter-scale": "0.95" }],
		["shake", { "animation-name": "shake", "animation-duration": "500ms", "animation-fill-mode": "both" }],
		// slide-in-from-{direction}-{steps} — steps follow Tailwind spacing scale (×0.25rem)
		[/^slide-in-from-right-(\d+)$/, ([, n]) => ({ "--un-enter-translate-x": `${+n * 0.25}rem` })],
		[/^slide-in-from-left-(\d+)$/, ([, n]) => ({ "--un-enter-translate-x": `-${+n * 0.25}rem` })],
		[/^slide-in-from-bottom-(\d+)$/, ([, n]) => ({ "--un-enter-translate-y": `${+n * 0.25}rem` })],
		[/^slide-in-from-top-(\d+)$/, ([, n]) => ({ "--un-enter-translate-y": `-${+n * 0.25}rem` })],
	],
	presets: [
		presetWind3(),
		presetIcons({
			scale: 1.2,
		}),
		presetTypography(),
	],
	transformers: [transformerVariantGroup()],
});
