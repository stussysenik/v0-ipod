"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface EditableTimeProps {
  value: number
  onChange: (seconds: number) => void
  className?: string
  disabled?: boolean
  isRemaining?: boolean
}

export function EditableTime({
  value,
  onChange,
  className = "",
  disabled = false,
  isRemaining = false,
}: EditableTimeProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${isRemaining ? "-" : ""}${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(formatTime(Math.abs(value)))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(formatTime(Math.abs(value)))
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const parseTime = (timeStr: string): number => {
    const cleanStr = timeStr.replace("-", "")
    const [minutes, seconds] = cleanStr.split(":").map(Number)
    if (isNaN(minutes) || isNaN(seconds)) return value
    const totalSeconds = minutes * 60 + seconds
    return isRemaining ? -totalSeconds : totalSeconds
  }

  const handleDoubleClick = () => {
    if (!disabled) {
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    const newSeconds = parseTime(localValue)
    if (newSeconds !== 0) {
      onChange(newSeconds)
    } else {
      setLocalValue(formatTime(Math.abs(value)))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setLocalValue(formatTime(Math.abs(value)))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^-?\d*:?\d*$/.test(value)) {
      setLocalValue(value)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-12 bg-transparent border-b border-[#043321] focus:outline-none focus:border-[#8a9a80] text-center ${className}`}
        placeholder="0:00"
      />
    )
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className={`cursor-text ${disabled ? "" : "hover:text-[#8a9a80]"} ${className}`}
    >
      {localValue}
    </span>
  )
}
