"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"

interface ProgressBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    handleDrag(e)
  }

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrag = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (progressRef.current) {
        const rect = progressRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = Math.min(Math.max(x / rect.width, 0), 1)
        onSeek(percentage * duration)
      }
    },
    [duration, onSeek],
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDrag(e)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, handleDrag, handleMouseUp])

  const progress = (currentTime / duration) * 100

  return (
    <div className="space-y-1.5">
      <div
        ref={progressRef}
        className="relative w-full h-1.5 bg-gray-200 rounded-sm cursor-pointer overflow-visible"
        onMouseDown={handleMouseDown}
      >
        {/* Progress Bar */}
        <div className="absolute inset-y-0 left-0 bg-black rounded-sm" style={{ width: `${progress}%` }} />

        {/* Playhead */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-black rounded-full shadow-sm"
          style={{
            left: `${progress}%`,
            transform: `translate(-50%, -50%)`,
          }}
        />
      </div>

      {/* Time Display */}
      <div className="flex justify-between text-xs font-mono text-gray-600">
        <span>{formatTime(currentTime)}</span>
        <span>-{formatTime(duration - currentTime)}</span>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
