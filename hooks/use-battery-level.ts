"use client";

import { useState, useEffect } from "react";

/**
 * Simulates a natural battery discharging cycle over time.
 * Starts at 100% and slowly decreases while the app is open.
 */
export function useBatteryLevel() {
	const [level, setLevel] = useState(1.0);

	useEffect(() => {
		// Start at a random high level (85% to 100%)
		setLevel(0.85 + Math.random() * 0.15);

		// Discharge cycle: 1% drop every 2 minutes (realistic-ish for demo)
		// 0.01 / (2 * 60 * 1000) = 0.01 / 120000 = 0.0000000833 per ms
		// We'll update every 10 seconds for smoothness
		const updateIntervalMs = 10000;
		const dischargePerUpdate = 0.001; // 0.1% every 10 seconds -> 1% every 100 seconds

		const interval = setInterval(() => {
			setLevel((prev) => Math.max(0.05, prev - dischargePerUpdate));
		}, updateIntervalMs);

		return () => clearInterval(interval);
	}, []);

	return level;
}
