import React from "react";

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
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={props["aria-label"] ?? label}
      className={`
        relative group flex h-11 w-11 items-center justify-center rounded-full border
        transition-all duration-200 ease-out active:scale-[0.98]
        disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100
        ${
          isActive
            ? "border-[#0F1114] bg-[#111315] text-white shadow-[0_12px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.14)] scale-[1.04]"
            : contrast
              ? "border-[#0F1114] bg-[#111315] text-white shadow-[0_12px_20px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-[#191C20] hover:shadow-[0_14px_24px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.12)] hover:scale-[1.03]"
              : "border-[#CDD2D8] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(237,239,242,0.96))] text-[#111315] shadow-[0_10px_18px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.98),inset_0_-1px_0_rgba(0,0,0,0.06)] hover:border-[#BFC5CC] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(240,242,245,0.98))] hover:shadow-[0_12px_20px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(0,0,0,0.07)] hover:scale-[1.03]"
        }
        ${className}
      `}
      {...props}
    >
      {icon}
      {badge && (
        <span className="pointer-events-none absolute -right-1 -top-1 rounded-full border border-[#E8B65A] bg-[#FFF4CC] px-1.5 py-[1px] text-[8px] font-bold uppercase tracking-[0.12em] text-[#7A5612] shadow-[0_4px_10px_rgba(0,0,0,0.12)]">
          {badge}
        </span>
      )}
      {label && (
        <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-full border border-black/10 bg-white/92 px-2.5 py-1 text-[11px] font-medium text-black/72 opacity-0 shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-opacity group-hover:opacity-100 sm:block">
          {label}
        </span>
      )}
    </button>
  );
}
