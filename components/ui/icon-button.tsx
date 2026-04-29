"use client";

import React, { useState } from "react";
import { sharedIconButtonTokens } from "@/lib/shared-ui-tokens";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  isActive?: boolean;
  contrast?: boolean;
  badge?: string;
}

export function IconButton({
  icon,
  label,
  isActive,
  contrast,
  badge,
  className = "",
  style: styleOverride,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  type,
  ...buttonProps
}: IconButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const variant = isActive ? "active" : contrast ? "contrast" : "default";
  const variantTokens = sharedIconButtonTokens.variants[variant];
  const appearance =
    !buttonProps.disabled && isHovered && variantTokens.hover
      ? variantTokens.hover
      : variantTokens;
  const scale = buttonProps.disabled
    ? 1
    : isPressed
      ? sharedIconButtonTokens.motion.pressScale
      : isActive
        ? sharedIconButtonTokens.motion.activeScale
        : isHovered
          ? sharedIconButtonTokens.motion.hoverScale
          : 1;

  return (
    <button
      type={type ?? "button"}
      aria-label={buttonProps["aria-label"] ?? label}
      className={`
        relative group flex items-center justify-center border
        transition-all ease-out disabled:cursor-not-allowed disabled:opacity-60
        ${className}
      `}
      style={{
        width: sharedIconButtonTokens.size,
        height: sharedIconButtonTokens.size,
        borderRadius: sharedIconButtonTokens.radius,
        borderColor: appearance.border,
        background: appearance.background,
        color: appearance.foreground,
        boxShadow: appearance.shadow,
        transitionDuration: `${sharedIconButtonTokens.motion.durationMs}ms`,
        transform: `scale(${scale})`,
        ...styleOverride,
      }}
      onPointerEnter={(event) => {
        setIsHovered(true);
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        setIsHovered(false);
        setIsPressed(false);
        onPointerLeave?.(event);
      }}
      onPointerDown={(event) => {
        setIsPressed(true);
        onPointerDown?.(event);
      }}
      onPointerUp={(event) => {
        setIsPressed(false);
        onPointerUp?.(event);
      }}
      onPointerCancel={(event) => {
        setIsPressed(false);
        onPointerCancel?.(event);
      }}
      {...buttonProps}
    >
      {icon}
      {badge && (
        <span
          className="pointer-events-none absolute -right-1 -top-1 rounded-full border px-1.5 py-[1px] text-[8px] font-bold uppercase tracking-[0.12em]"
          style={{
            borderColor: sharedIconButtonTokens.badge.border,
            background: sharedIconButtonTokens.badge.background,
            color: sharedIconButtonTokens.badge.foreground,
            boxShadow: sharedIconButtonTokens.badge.shadow,
          }}
        >
          {badge}
        </span>
      )}
      {label && (
        <span
          className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium opacity-0 shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-opacity group-hover:opacity-100 sm:block"
          style={{
            borderColor: sharedIconButtonTokens.tooltip.border,
            background: sharedIconButtonTokens.tooltip.background,
            color: sharedIconButtonTokens.tooltip.foreground,
            boxShadow: sharedIconButtonTokens.tooltip.shadow,
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
