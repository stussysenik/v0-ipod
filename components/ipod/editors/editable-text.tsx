"use client";

import { useEffect, useRef, useState } from "react";

import { useDebouncedCallback } from "./use-debounced-callback";
import { useFixedEditor } from "./fixed-editor";
import { MarqueeText } from "@/components/ui/marquee-text";

/**
 * How long typing must pause before a keystroke is committed to the reducer (which
 * re-renders the 3D scene and persists to localStorage). Short enough to feel live,
 * long enough that a normal typing cadence collapses into a single commit. See
 * `lib/debounce.ts` for the why.
 */
const LIVE_COMMIT_DEBOUNCE_MS = 200;

import type React from "react";
import type { MarqueeMode } from "@/lib/marquee";

interface EditableTextProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
	disabled?: boolean;
	editLabel?: string;
	dataTestId?: string;
	animate?: boolean;
	preview?: boolean;
	captureReady?: boolean;
	onOverflowChange?: (overflow: boolean) => void;
	singleLine?: boolean;
	staggerIndex?: number;
	mode?: MarqueeMode;
}

export function EditableText({
	value,
	onChange,
	className = "",
	disabled = false,
	editLabel = "Edit text",
	dataTestId,
	animate = false,
	preview = false,
	captureReady = false,
	onOverflowChange,
	singleLine = false,
	staggerIndex = 0,
	mode,
}: EditableTextProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [localValue, setLocalValue] = useState(value);
	const inputRef = useRef<HTMLInputElement>(null);
	const { isTouchEditingPreferred, openEditor } = useFixedEditor();
	// Live, debounced commit: the input stays instant (localValue) while the device
	// screen + persistence catch up once typing settles. blur/Enter flush this;
	// Escape cancels it. The input is controlled by `localValue`, never `value`, so
	// these deferred commits can't move the caret mid-edit.
	const liveCommit = useDebouncedCallback(onChange, LIVE_COMMIT_DEBOUNCE_MS);

	useEffect(() => {
		if (isEditing) return;
		setLocalValue(value);
	}, [value, isEditing]);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	useEffect(() => {
		if (disabled && isEditing) {
			liveCommit.cancel();
			setIsEditing(false);
			setLocalValue(value);
		}
	}, [disabled, isEditing, value, liveCommit]);

	const handleDesktopActivate = () => {
		if (disabled) return;
		setIsEditing(true);
	};

	const handleTouchActivate = () => {
		if (disabled) return;
		openEditor({
			title: editLabel,
			value,
			placeholder: "Type text",
			inputMode: "text",
			// Live preview on the device while typing in the bottom sheet; the provider
			// debounces these, and onCommit lands the authoritative final value.
			onPreview: (nextValue) => onChange(nextValue),
			onCommit: (nextValue) => onChange(nextValue),
		});
	};

	const handleBlur = () => {
		setIsEditing(false);
		// Cancel the in-flight debounce and write the authoritative final value now —
		// no waiting out the debounce window when focus is already gone.
		liveCommit.cancel();
		onChange(localValue);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleBlur();
		} else if (e.key === "Escape") {
			liveCommit.cancel();
			setIsEditing(false);
			setLocalValue(value);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const next = e.target.value;
		setLocalValue(next);
		liveCommit.call(next);
	};

	if (isEditing) {
		return (
			<input
				ref={inputRef}
				className={`w-full bg-white/80 border-b border-black focus:outline-none focus:border-blue-500 rounded px-1 whitespace-normal break-words ${className}`}
				data-testid={dataTestId}
				type="text"
				aria-label={editLabel}
				value={localValue}
				// Metadata fields, not prose: kill the autocomplete dropdown and the red
				// spell-check squiggles, and label the keyboard's submit key "Done".
				autoComplete="off"
				autoCorrect="off"
				spellCheck={false}
				enterKeyHint="done"
				onBlur={handleBlur}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
			/>
		);
	}

	return (
		<span
			className={`block w-full min-w-0 max-w-full rounded px-0.5 -mx-0.5 transition-colors [overflow-wrap:anywhere] [hyphens:auto] ${
				disabled
					? "cursor-default"
					: "cursor-text hover:bg-black/5 hover:text-blue-900"
			} ${className}`}
			data-testid={animate || captureReady ? undefined : dataTestId}
			onDoubleClick={isTouchEditingPreferred ? undefined : handleDesktopActivate}
			onPointerUp={isTouchEditingPreferred ? handleTouchActivate : undefined}
		>
			{animate || captureReady ? (
				<MarqueeText
					captureReady={captureReady}
					className="w-full"
					dataTestId={dataTestId}
					preview={preview || captureReady}
					text={value}
					onOverflowChange={onOverflowChange}
					staggerIndex={staggerIndex}
					mode={mode}
				/>
			) : (
				<span
					className={`block w-full ${
						singleLine
							? "overflow-hidden whitespace-nowrap [text-overflow:clip] pr-1"
							: "whitespace-normal break-words [overflow-wrap:anywhere] [hyphens:auto]"
					}`}
				>
					{value}
				</span>
			)}
		</span>
	);
}
