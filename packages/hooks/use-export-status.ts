"use client";

import { useCallback, useState } from "react";

export type ExportStatus = "idle" | "preparing" | "encoding" | "sharing" | "success" | "error";
export type ExportKind = "png" | "gif" | null;

export interface UseExportStatusReturn {
	status: ExportStatus;
	kind: ExportKind;
	isBusy: boolean;
	isSuccess: boolean;
	startExport: (kind: "png" | "gif") => void;
	setSuccess: () => void;
	setError: () => void;
	reset: () => void;
}

/**
 * Custom hook for managing export status
 * Following Addy Osmani: Encapsulate stateful logic in hooks
 */
export function useExportStatus(): UseExportStatusReturn {
	const [status, setStatus] = useState<ExportStatus>("idle");
	const [kind, setKind] = useState<ExportKind>(null);

	const startExport = useCallback((exportKind: "png" | "gif") => {
		setKind(exportKind);
		setStatus("preparing");
	}, []);

	const setSuccess = useCallback(() => {
		setStatus("success");
	}, []);

	const setError = useCallback(() => {
		setStatus("error");
	}, []);

	const reset = useCallback(() => {
		setStatus("idle");
		setKind(null);
	}, []);

	const isBusy = status !== "idle" && status !== "success" && status !== "error";
	const isSuccess = status === "success";

	return {
		status,
		kind,
		isBusy,
		isSuccess,
		startExport,
		setSuccess,
		setError,
		reset,
	};
}

export default useExportStatus;
