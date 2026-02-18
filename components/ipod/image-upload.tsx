"use client";

import React, { useId, useRef } from "react";
import placeholderLogo from "@/public/placeholder-logo.png";

interface ImageUploadProps {
  currentImage: string;
  onImageChange: (image: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  currentImage,
  onImageChange,
  className = "",
  disabled = false,
}: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          onImageChange(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Only use crossOrigin for external URLs, not for data URLs or local images
  const isDataUrl = currentImage?.startsWith("data:");
  const isLocalImage = currentImage?.startsWith("/");
  const needsCrossOrigin = currentImage && !isDataUrl && !isLocalImage;

  return (
    <>
      <label
        htmlFor={inputId}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`${disabled ? "cursor-default" : "cursor-pointer"} touch-manipulation ${className}`}
      >
        <img
          src={currentImage || placeholderLogo.src}
          alt="Album artwork"
          data-testid="artwork-image"
          className="w-full h-full object-cover"
          {...(needsCrossOrigin ? { crossOrigin: "anonymous" } : {})}
        />
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        data-testid="artwork-input"
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          margin: "-1px",
          padding: 0,
          border: 0,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      />
    </>
  );
}
