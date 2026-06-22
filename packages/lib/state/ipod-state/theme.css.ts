import { createThemeContract, createTheme } from "@vanilla-extract/css";

export const vars = createThemeContract({
	material: {
		shellColor: null,
		gasketColor: null,
		chamferShadow: null,
		specularSheen: null,
		middleButtonDepth: null,
	},
	space: {
		small: "4px",
		medium: "8px",
		large: "16px",
	},
});

export const liveTheme = createTheme(vars, {
	material: {
		shellColor: "var(--skin-color)",
		gasketColor: "var(--gasket-color)",
		// High-fidelity live shadows with multiple layers and filters
		chamferShadow: "inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -1.5px 3px rgba(0,0,0,0.14)",
		specularSheen: "radial-gradient(ellipse at 24% 8%, rgba(255,255,255,0.16) 0%, transparent 55%)",
		middleButtonDepth: "inset 0 1px 0 rgba(255,255,255,0.86), inset 0 -1px 0 rgba(0,0,0,0.03)",
	},
	space: {
		small: "4px",
		medium: "8px",
		large: "16px",
	},
});

// Capture-safe theme flattens complex depth into html-to-image friendly tokens
export const captureTheme = createTheme(vars, {
	material: {
		shellColor: "var(--skin-color)",
		gasketColor: "var(--gasket-color)",
		// Pre-baked, simpler but qualitative shadows for export
		chamferShadow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.1)",
		specularSheen: "linear-gradient(162deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)",
		middleButtonDepth: "inset 0 1px 1px rgba(255,255,255,0.5)",
	},
	space: {
		small: "4px",
		medium: "8px",
		large: "16px",
	},
});
