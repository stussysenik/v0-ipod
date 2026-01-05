"use client"

import React, { useRef } from "react"

interface ImageUploadProps {
  currentImage: string
  onImageChange: (image: string) => void
  className?: string
}

export function ImageUpload({ currentImage, onImageChange, className = "" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          onImageChange(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <div 
        onClick={handleClick}
        className={`cursor-pointer ${className}`}
      >
        <img
          src={currentImage || "/placeholder.svg"}
          alt="Album artwork"
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </>
  )
}
