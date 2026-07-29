"use client";

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

import { getSurfaceToken, IPOD_5G_BLACK } from "@/lib/color-manifest";
import type { IpodHardwarePresetId } from "@/types/ipod-state";

/**
 * Theme colours, read from the manifest rather than transcribed.
 *
 * This was a hand-typed fourth copy of the wheel colorway and had already
 * drifted from it — the dark border and centre carried #2c2a2b/#3a3838 against
 * the manifest's #2C2C2E/#3A3A3C, and the light label carried the #8E8E93
 * anchor that measures 2.99:1 against the 3:1 floor the manifest sets. Reading
 * the tokens means a colour can only be changed where it is attested.
 */
const wheelBand = (band: "dark" | "light") => ({
	surface: getSurfaceToken(`wheel.${band}.surface`),
	border: getSurfaceToken(`wheel.${band}.border`),
	label: getSurfaceToken(`wheel.${band}.label`),
	center: getSurfaceToken(`wheel.${band}.center`),
	centerBorder: getSurfaceToken(`wheel.${band}.center_border`),
});

export const IPOD_6G_COLORS = {
	case: {
		black: IPOD_5G_BLACK,
		white: getSurfaceToken("wheel.light.surface"),
	},
	background: {
		white: "#FFFFFF",
		dark: "#000000",
	},
	wheel: {
		dark: wheelBand("dark"),
		light: wheelBand("light"),
	},
} as const;

export type IPodTheme = "black" | "white";

export interface UseIPodThemeReturn {
	theme: IPodTheme;
	isBlack: boolean;
	caseColor: string;
	backgroundColor: string;
	wheelColors: typeof IPOD_6G_COLORS.wheel.dark | typeof IPOD_6G_COLORS.wheel.light;
	presetId: IpodHardwarePresetId;
	toggleTheme: () => void;
	setTheme: (theme: IPodTheme) => void;
}

const STORAGE_KEY = "ipod-theme";

function readStoredTheme(): IPodTheme | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw === "black" || raw === "white") return raw;
		// Migrate legacy `silver` → `white`
		if (raw === "silver") {
			try {
				window.localStorage.setItem(STORAGE_KEY, "white");
			} catch {
				// Ignore quota / private-mode failures; return migrated value anyway.
			}
			return "white";
		}
	} catch {
		// Ignore Safari private-mode SecurityError and similar.
	}
	return null;
}

/**
 * Custom hook for iPod theme management
 */
export function useIPodTheme(initialTheme: IPodTheme = "black"): UseIPodThemeReturn {
	const [theme, setThemeState] = useState<IPodTheme>(initialTheme);

	useEffect(() => {
		const stored = readStoredTheme();
		if (stored) setThemeState(stored);
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			window.localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			// Ignore quota / private-mode failures.
		}
	}, [theme]);

	const toggleTheme = useCallback(() => {
		setThemeState((prev) => (prev === "black" ? "white" : "black"));
	}, []);

	const setTheme = useCallback((nextTheme: IPodTheme) => {
		setThemeState(nextTheme);
	}, []);

	const isBlack = theme === "black";

	const caseColor = isBlack ? IPOD_6G_COLORS.case.black : IPOD_6G_COLORS.case.white;

	const backgroundColor = IPOD_6G_COLORS.background.white;

	const wheelColors = isBlack ? IPOD_6G_COLORS.wheel.dark : IPOD_6G_COLORS.wheel.light;

	const presetId: IpodHardwarePresetId = isBlack
		? "classic-2008-black"
		: "classic-2008-silver";

	return {
		theme,
		isBlack,
		caseColor,
		backgroundColor,
		wheelColors,
		presetId,
		toggleTheme,
		setTheme,
	};
}

const IPodThemeContext = createContext<IPodTheme>("black");

export function IPodThemeProvider({ theme, children }: { theme: IPodTheme; children: ReactNode }) {
	return <IPodThemeContext.Provider value={theme}>{children}</IPodThemeContext.Provider>;
}

export function useIPodThemeValue(): IPodTheme {
	return useContext(IPodThemeContext);
}

export default useIPodTheme;
