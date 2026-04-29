"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useFixedEditor } from "./fixed-editor";

import type React from "react";

interface EditableTimeProps {
	value: number;
	onChange: (seconds: number) => void;
	className?: string;
	disabled?: boolean;
	isRemaining?: boolean;
	editLabel?: string;
}

export function EditableTime({
	value,
	onChange,
	className = "",
	disabled = false,
	isRemaining = false,
	editLabel = "Edit time",
}: EditableTimeProps) {
	const formatTime = useCallback(
		(seconds: number) => {
			const minutes = Math.floor(seconds / 60);
			const remainingSeconds = Math.floor(seconds % 60);
			return `${isRemaining ? "-" : ""}${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
		},
		[isRemaining],
	);

	const displayValue = useMemo(() => formatTime(Math.abs(value)), [formatTime, value]);

	const [isEditing, setIsEditing] = useState(false);
	const [localValue, setLocalValue] = useState(displayValue);
	const inputRef = useRef<HTMLInputElement>(null);
	const { isTouchEditingPreferred, openEditor } = useFixedEditor();

	useEffect(() => {
		if (isEditing) return;
		setLocalValue(displayValue);
	}, [displayValue, isEditing]);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const parseTime = (timeStr: string): number => {
		const cleanStr = timeStr.replace("-", "");
		const [minutes, seconds] = cleanStr.split(":").map(Number);
		if (Number.isNaN(minutes) || Number.isNaN(seconds)) return value;
		const totalSeconds = minutes * 60 + seconds;
		return Math.max(0, totalSeconds);
	};

	const handleDesktopActivate = () => {
		if (!disabled) {
			setIsEditing(true);
		}
	};

	const handleTouchActivate = () => {
		if (disabled) return;
		openEditor({
			title: editLabel,
			value: displayValue,
			placeholder: "0:00",
			inputMode: "numeric",
			pattern: "[-0-9:]*",
			onCommit: (nextValue) => {
				const newSeconds = parseTime(nextValue);
				if (Number.isFinite(newSeconds) && newSeconds >= 0) {
					onChange(newSeconds);
				}
			},
		});
	};

	const handleBlur = () => {
		setIsEditing(false);
		const newSeconds = parseTime(localValue);
		if (Number.isFinite(newSeconds) && newSeconds >= 0) {
			onChange(newSeconds);
		} else {
			setLocalValue(displayValue);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleBlur();
		} else if (e.key === "Escape") {
			setIsEditing(false);
			setLocalValue(displayValue);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		if (/^-?\d*:?\d*$/.test(val)) {
			setLocalValue(val);
		}
	};

	if (isEditing) {
		return (
			<input
				ref={inputRef}
				className={`w-12 bg-white/50 border-b border-black focus:outline-none focus:border-blue-500 text-center rounded ${className}`}
				placeholder="0:00"
				type="text"
				value={localValue}
				onBlur={handleBlur}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
			/>
		);
	}

  return (
    <span
      onDoubleClick={isTouchEditingPreferred ? undefined : handleDesktopActivate}
      onPointerUp={isTouchEditingPreferred ? handleTouchActivate : undefined}
      data-export-time-value={value}
      className={`cursor-text ${disabled ? "" : "hover:text-blue-600 hover:bg-black/5 px-1 rounded transition-colors"} ${className}`}
    >
      {displayValue}
    </span>
  );
}
