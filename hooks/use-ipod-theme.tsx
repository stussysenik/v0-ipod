"use client";

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

import type { IpodHardwarePresetId } from "@/types/ipod-state";

// iPod 6th Generation Color Tokens
// Based on reference: ipod-6th-classic-gen.png
export const IPOD_6G_COLORS = {
	case: {
		black: "#1A1A1A",
		white: "#F5F5F7",
	},
	background: {
		white: "#FFFFFF",
		dark: "#000000",
	},
	wheel: {
		dark: {
			surface: "#1C1C1E",
			border: "#2C2C2E",
			label: "#FFFFFF",
			center: "#2C2C2E",
			centerBorder: "#3A3A3C",
		},
		light: {
			surface: "#F5F5F7",
			border: "#D1D1D6",
			label: "#8E8E93",
			center: "#E5E5EA",
			centerBorder: "#D1D1D6",
		},
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
