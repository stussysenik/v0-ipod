"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function EditableText({ value, onChange, className = "" }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    onChange(localValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setLocalValue(value)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
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
        className={`w-full bg-white/80 border-b border-black focus:outline-none focus:border-blue-500 rounded px-1 ${className}`}
      />
    )
  }

  return (
    <span onDoubleClick={handleDoubleClick} className={`cursor-text block w-full break-words hover:bg-black/5 hover:text-blue-900 rounded px-0.5 -mx-0.5 transition-colors ${className}`}>
      {value}
    </span>
  )
}
