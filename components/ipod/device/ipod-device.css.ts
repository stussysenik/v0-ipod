import { style, createTheme } from "@vanilla-extract/css";

export const [themeClass, vars] = createTheme({
	color: {
		shell: "#e2e2e2",
		screen: "#000000",
		wheel: "#ffffff",
	},
	space: {
		small: "4px",
		medium: "8px",
		large: "16px",
	},
});

export const deviceContainer = style({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	padding: vars.space.large,
	backgroundColor: vars.color.shell,
	borderRadius: "40px",
	boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
});
