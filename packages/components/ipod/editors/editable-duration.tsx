"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type React from "react";

interface EditableDurationProps {
	value: number;
	onChange: (seconds: number) => void;
	className?: string;
}

export function EditableDuration({ value, onChange, className = "" }: EditableDurationProps) {
	const formatTime = useCallback((seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	}, []);

	const displayValue = useMemo(() => formatTime(value), [formatTime, value]);

	const [isEditing, setIsEditing] = useState(false);
	const [localValue, setLocalValue] = useState(displayValue);
	const inputRef = useRef<HTMLInputElement>(null);

	// Sync local value when not editing and prop changes
	if (!isEditing && localValue !== displayValue) {
		setLocalValue(displayValue);
	}

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const parseTime = (timeStr: string): number => {
		const [minutes, seconds] = timeStr.split(":").map(Number);
		if (Number.isNaN(minutes) || Number.isNaN(seconds)) return value;
		return minutes * 60 + seconds;
	};

	const handleDoubleClick = () => {
		setIsEditing(true);
	};

	const handleBlur = () => {
		setIsEditing(false);
		const newSeconds = parseTime(localValue);
		if (newSeconds > 0) {
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
		if (/^\d*:?\d*$/.test(val)) {
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
			className={`cursor-text hover:text-blue-600 hover:bg-black/5 px-1 rounded transition-colors ${className}`}
			onDoubleClick={handleDoubleClick}
		>
			{displayValue}
		</span>
	);
}
