"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface EditableDurationProps {
  value: number
  onChange: (seconds: number) => void
  className?: string
}

export function EditableDuration({ value, onChange, className = "" }: EditableDurationProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(formatTime(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(formatTime(value))
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const parseTime = (timeStr: string): number => {
    const [minutes, seconds] = timeStr.split(":").map(Number)
    if (isNaN(minutes) || isNaN(seconds)) return value
    return minutes * 60 + seconds
  }

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    const newSeconds = parseTime(localValue)
    if (newSeconds > 0) {
      onChange(newSeconds)
    } else {
      setLocalValue(formatTime(value))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setLocalValue(formatTime(value))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*:?\d*$/.test(value)) {
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
        className={`w-12 bg-white/50 border-b border-black focus:outline-none focus:border-blue-500 text-center rounded ${className}`}
        placeholder="0:00"
      />
    )
  }

  return (
    <span onDoubleClick={handleDoubleClick} className={`cursor-text hover:text-blue-600 hover:bg-black/5 px-1 rounded transition-colors ${className}`}>
      {localValue}
    </span>
  )
}
