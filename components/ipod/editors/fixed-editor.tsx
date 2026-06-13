"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { useDebouncedCallback } from "./use-debounced-callback";

import type React from "react";

type EditorInputMode = React.HTMLAttributes<HTMLInputElement>["inputMode"];

/** Matches EditableText's inline debounce so the two paths feel identical. */
const LIVE_PREVIEW_DEBOUNCE_MS = 200;

interface FixedEditorRequest {
	title: string;
	value: string;
	placeholder?: string;
	inputMode?: EditorInputMode;
	pattern?: string;
	/**
	 * Optional live preview as the user types in the sheet — debounced, so the device
	 * behind the sheet updates without committing on every keystroke. Because previews
	 * mutate the model in place, Cancel/dismiss restores the original `value`.
	 */
	onPreview?: (value: string) => void;
	onCommit: (value: string) => void;
}

interface FixedEditorContextValue {
	isTouchEditingPreferred: boolean;
	isEditorOpen: boolean;
	openEditor: (request: FixedEditorRequest) => void;
	closeEditor: () => void;
}

const FixedEditorContext = createContext<FixedEditorContextValue | null>(null);

function detectCoarsePointer(): boolean {
	if (typeof window === "undefined") return false;
	return (
		window.matchMedia("(pointer: coarse)").matches ||
		window.matchMedia("(hover: none)").matches ||
		navigator.maxTouchPoints > 0
	);
}

export function FixedEditorProvider({
	children,
	resetKey = 0,
}: {
	children: React.ReactNode;
	resetKey?: number;
}) {
	const [request, setRequest] = useState<FixedEditorRequest | null>(null);
	const [draftValue, setDraftValue] = useState("");
	const [isTouchEditingPreferred, setIsTouchEditingPreferred] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	// Mirror the live request + a "did we push a preview?" flag into refs so the
	// debounced preview and the revert-on-cancel logic read current values without
	// re-creating callbacks each render.
	const requestRef = useRef<FixedEditorRequest | null>(null);
	const previewedRef = useRef(false);

	useEffect(() => {
		requestRef.current = request;
	}, [request]);

	const livePreview = useDebouncedCallback((next: string) => {
		requestRef.current?.onPreview?.(next);
	}, LIVE_PREVIEW_DEBOUNCE_MS);

	useEffect(() => {
		const syncTouchPreference = () => {
			setIsTouchEditingPreferred(detectCoarsePointer());
		};

		syncTouchPreference();
		window.addEventListener("resize", syncTouchPreference, { passive: true });
		window.addEventListener("orientationchange", syncTouchPreference, {
			passive: true,
		});
		return () => {
			window.removeEventListener("resize", syncTouchPreference);
			window.removeEventListener("orientationchange", syncTouchPreference);
		};
	}, []);

	useEffect(() => {
		if (!request) return;
		setDraftValue(request.value);
		const focusTimer = window.setTimeout(() => {
			inputRef.current?.focus();
			inputRef.current?.select();
		}, 30);
		return () => {
			window.clearTimeout(focusTimer);
		};
	}, [request]);

	useEffect(() => {
		livePreview.cancel();
		previewedRef.current = false;
		setRequest(null);
	}, [resetKey, livePreview]);

	// Cancel/dismiss: drop the pending preview and, if live previews already mutated
	// the model, put the original value back so a cancelled edit leaves no trace.
	const closeEditor = useCallback(() => {
		const req = requestRef.current;
		livePreview.cancel();
		if (req && previewedRef.current) {
			(req.onPreview ?? req.onCommit)(req.value);
		}
		previewedRef.current = false;
		setRequest(null);
	}, [livePreview]);

	const commitEditor = useCallback(() => {
		const req = requestRef.current;
		if (!req) return;
		livePreview.cancel();
		previewedRef.current = false;
		req.onCommit(draftValue);
		setRequest(null);
	}, [draftValue, livePreview]);

	const handleDraftChange = useCallback(
		(next: string) => {
			setDraftValue(next);
			if (requestRef.current?.onPreview) {
				previewedRef.current = true;
				livePreview.call(next);
			}
		},
		[livePreview],
	);

	const openEditor = useCallback((nextRequest: FixedEditorRequest) => {
		previewedRef.current = false;
		setRequest(nextRequest);
	}, []);

	const value = useMemo<FixedEditorContextValue>(
		() => ({
			isTouchEditingPreferred,
			isEditorOpen: !!request,
			openEditor,
			closeEditor,
		}),
		[closeEditor, isTouchEditingPreferred, openEditor, request],
	);

	return (
		<FixedEditorContext.Provider value={value}>
			{children}
			{request && (
				<div
					className="fixed inset-0 z-[80] bg-black/10 backdrop-blur-[1px]"
					data-testid="fixed-editor"
					onPointerDown={(event) => {
						if (event.target === event.currentTarget) {
							closeEditor();
						}
					}}
				>
					<div className="absolute inset-x-0 bottom-0 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
						<div className="mx-auto w-full max-w-md rounded-t-2xl border border-[#D0D4DA] bg-[#F5F5F3]/98 p-3 shadow-[0_-12px_32px_rgba(0,0,0,0.18)]">
							<div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5A616A]">
								{request.title}
							</div>
							<input
								ref={inputRef}
								// text-[16px] is load-bearing on iOS: anything smaller makes
								// Safari zoom the viewport on focus. Keep it ≥16px.
								className="h-11 w-full rounded-lg border border-[#BFC5CC] bg-white px-3 text-[16px] font-medium text-[#111827] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#93C5FD]"
								data-testid="fixed-editor-input"
								id="fixed-editor-input"
								aria-label={request.title}
								inputMode={request.inputMode}
								name="fixed-editor-input"
								pattern={request.pattern}
								placeholder={request.placeholder}
								autoComplete="off"
								autoCorrect="off"
								spellCheck={false}
								enterKeyHint="done"
								value={draftValue}
								onChange={(event) =>
									handleDraftChange(event.target.value)
								}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										commitEditor();
									}
									if (
										event.key ===
										"Escape"
									) {
										event.preventDefault();
										closeEditor();
									}
								}}
							/>
							<div className="mt-3 flex justify-end gap-2">
								<button
									className="rounded-lg border border-[#C9CED5] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4B5563]"
									type="button"
									onClick={closeEditor}
								>
									Cancel
								</button>
								<button
									className="rounded-lg border border-[#111827] bg-[#111827] px-3 py-1.5 text-[12px] font-semibold text-white"
									data-testid="fixed-editor-done"
									type="button"
									onClick={commitEditor}
								>
									Done
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</FixedEditorContext.Provider>
	);
}

export function useFixedEditor(): FixedEditorContextValue {
	const context = useContext(FixedEditorContext);
	if (!context) {
		return {
			isTouchEditingPreferred: false,
			isEditorOpen: false,
			openEditor: () => {},
			closeEditor: () => {},
		};
	}
	return context;
}
