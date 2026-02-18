"use client";

import type React from "react";
import { useState, useRef, useEffect, useMemo } from "react";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function EditableText({
  value,
  onChange,
  className = "",
  disabled = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const isTouchDevice = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  // Sync local value when not editing and prop changes
  if (!isEditing && localValue !== value) {
    setLocalValue(value);
  }

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

  const handleDoubleClick = () => {
    if (disabled) return;
    setIsEditing(true);
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
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-white/80 border-b border-black focus:outline-none focus:border-blue-500 rounded px-1 ${className}`}
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      onClick={isTouchDevice ? handleDoubleClick : undefined}
      className={`block w-full break-words rounded px-0.5 -mx-0.5 transition-colors ${
        disabled
          ? "cursor-default"
          : "cursor-text hover:bg-black/5 hover:text-blue-900"
      } ${className}`}
    >
      {value}
    </span>
  );
}
