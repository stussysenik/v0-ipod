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
    <div className="w-full">
      <div
        ref={progressRef}
        className="relative w-full h-[10px] bg-white border border-[#999] shadow-inner cursor-pointer overflow-hidden"
        onMouseDown={handleMouseDown}
        style={{
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)"
        }}
      >
        {/* Progress Bar (Blue Gel style) */}
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(180deg, #74ACDF 0%, #3584D3 50%, #1766B5 51%, #358BDB 100%)"
          }}
        />
      </div>
    </div>
  )
}
