"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

interface EditableTimeProps {
  value: number;
  onChange: (seconds: number) => void;
  className?: string;
  disabled?: boolean;
  isRemaining?: boolean;
}

export function EditableTime({
  value,
  onChange,
  className = "",
  disabled = false,
  isRemaining = false,
}: EditableTimeProps) {
  const formatTime = useCallback(
    (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${isRemaining ? "-" : ""}${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    },
    [isRemaining],
  );

  const displayValue = useMemo(
    () => formatTime(Math.abs(value)),
    [formatTime, value],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(displayValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const isTouchDevice = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0
    );
  }, []);

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
    const cleanStr = timeStr.replace("-", "");
    const [minutes, seconds] = cleanStr.split(":").map(Number);
    if (isNaN(minutes) || isNaN(seconds)) return value;
    const totalSeconds = minutes * 60 + seconds;
    return Math.max(0, totalSeconds);
  };

  const handleDoubleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
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
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-12 bg-white/50 border-b border-black focus:outline-none focus:border-blue-500 text-center rounded ${className}`}
        placeholder="0:00"
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      onClick={isTouchDevice ? handleDoubleClick : undefined}
      className={`cursor-text ${disabled ? "" : "hover:text-blue-600 hover:bg-black/5 px-1 rounded transition-colors"} ${className}`}
    >
      {displayValue}
    </span>
  );
}
