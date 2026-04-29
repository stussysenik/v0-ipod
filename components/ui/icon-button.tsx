"use client";

import React, { useState } from "react";
import { sharedIconButtonTokens } from "@/lib/shared-ui-tokens";

import { useIPodThemeValue } from "@/hooks/use-ipod-theme";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	icon: React.ReactNode;
	label?: string;
	isActive?: boolean;
	contrast?: boolean;
	badge?: string;
}

const DARK_ACTIVE =
	"border-[#0F1114] bg-[#111315] text-white shadow-[0_12px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.14)] scale-[1.04]";

const DARK_CONTRAST =
	"border-[#0F1114] bg-[#111315] text-white shadow-[0_12px_20px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-[#191C20] hover:shadow-[0_14px_24px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.12)] hover:scale-[1.03]";

const DARK_DEFAULT =
	"border-[#0F1114] bg-[#111315] text-white shadow-[0_10px_18px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-[#191C20] hover:shadow-[0_12px_22px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.14)] hover:scale-[1.03]";

const LIGHT_DEFAULT =
	"border-[#CDD2D8] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(237,239,242,0.96))] text-[#111315] shadow-[0_10px_18px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.98),inset_0_-1px_0_rgba(0,0,0,0.06)] hover:border-[#BFC5CC] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(240,242,245,0.98))] hover:shadow-[0_12px_20px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(0,0,0,0.07)] hover:scale-[1.03]";

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
