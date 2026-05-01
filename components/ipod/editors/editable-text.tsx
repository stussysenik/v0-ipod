"use client";

import { useEffect, useRef, useState } from "react";

import { useFixedEditor } from "./fixed-editor";
import { MarqueeText } from "@/components/ui/marquee-text";

import type React from "react";

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
}: EditableTextProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [localValue, setLocalValue] = useState(value);
	const inputRef = useRef<HTMLInputElement>(null);
	const { isTouchEditingPreferred, openEditor } = useFixedEditor();

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
			setIsEditing(false);
			setLocalValue(value);
		}
	}, [disabled, isEditing, value]);

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
			onCommit: (nextValue) => onChange(nextValue),
		});
	};

	const handleBlur = () => {
		setIsEditing(false);
		onChange(localValue);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleBlur();
		} else if (e.key === "Escape") {
			setIsEditing(false);
			setLocalValue(value);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalValue(e.target.value);
	};

	if (isEditing) {
		return (
			<input
				ref={inputRef}
				className={`w-full bg-white/80 border-b border-black focus:outline-none focus:border-blue-500 rounded px-1 whitespace-normal break-words ${className}`}
				data-testid={dataTestId}
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
				/>
			) : (
				<span
					className={`block w-full ${
						singleLine
							? "overflow-hidden text-ellipsis whitespace-nowrap"
							: "whitespace-normal break-words [overflow-wrap:anywhere] [hyphens:auto]"
					}`}
				>
					{value}
				</span>
			)}
		</span>
	);
}
