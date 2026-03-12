"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useFixedEditor } from "./fixed-editor";
import { MarqueeText } from "../ui/marquee-text";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  editLabel?: string;
  dataTestId?: string;
  animate?: boolean;
}

export function EditableText({
  value,
  onChange,
  className = "",
  disabled = false,
  editLabel = "Edit text",
  dataTestId,
  animate = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isTouchEditingPreferred, openEditor } = useFixedEditor();

  const openInlineEditor = (nextValue = value) => {
    setLocalValue(nextValue);
    setIsEditing(true);
  };

  const openTouchEditor = (nextValue = value) => {
    openEditor({
      title: editLabel,
      value: nextValue,
      placeholder: "Type text",
      inputMode: "text",
      onCommit: (committedValue) => onChange(committedValue),
    });
  };

  const normalizePastedText = (text: string) =>
    text.replace(/\r?\n+/g, " ").replace(/\t+/g, " ").trim();

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
    openInlineEditor();
  };

  const handleTouchActivate = () => {
    if (disabled) return;
    openTouchEditor();
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

  const handleDisplayKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isTouchEditingPreferred) {
        openTouchEditor();
      } else {
        openInlineEditor();
      }
    }
  };

  const handleDisplayPaste = (e: React.ClipboardEvent<HTMLSpanElement>) => {
    if (disabled) return;

    const pastedText = normalizePastedText(e.clipboardData.getData("text/plain"));
    if (!pastedText) return;

    e.preventDefault();
    if (isTouchEditingPreferred) {
      openTouchEditor(pastedText);
    } else {
      openInlineEditor(pastedText);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-white/80 border-b border-black focus:outline-none focus:border-blue-500 rounded px-1 whitespace-normal break-words ${className}`}
        data-testid={dataTestId}
      />
    );
  }

  return (
    <span
      onDoubleClick={isTouchEditingPreferred ? undefined : handleDesktopActivate}
      onPointerUp={isTouchEditingPreferred ? handleTouchActivate : undefined}
      className={`block w-full min-w-0 max-w-full rounded px-0.5 -mx-0.5 transition-colors [overflow-wrap:anywhere] [hyphens:auto] ${
        disabled ? "cursor-default" : "cursor-text hover:bg-black/5 hover:text-blue-900"
      } ${className}`}
      data-testid={dataTestId}
    >
      {animate ? (
        <MarqueeText
          text={value}
          className="w-full"
          textClassName="whitespace-nowrap"
          autoPlay
        />
      ) : (
        <span className="block w-full whitespace-normal break-words [overflow-wrap:anywhere] [hyphens:auto]">
          {value}
        </span>
      )}
    </span>
  );
}
