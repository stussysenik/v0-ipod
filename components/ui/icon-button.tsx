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
        relative group flex h-12 w-12 items-center justify-center rounded-full border
        transition-all duration-200 ease-out active:scale-[0.98]
        disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100
        ${
          isActive
            ? "border-[color:var(--scene-inspector-border-strong)] bg-[linear-gradient(180deg,rgba(35,37,41,0.98),rgba(16,18,21,0.98))] text-white shadow-[0_18px_28px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.32)] scale-[1.04]"
            : contrast
              ? "border-[#0F1114] bg-[linear-gradient(180deg,rgba(31,33,37,0.98),rgba(15,17,20,0.98))] text-white shadow-[0_18px_26px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.28)] hover:bg-[linear-gradient(180deg,rgba(37,39,44,0.98),rgba(20,22,26,0.98))] hover:shadow-[0_20px_30px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.14)] hover:scale-[1.03]"
              : "border-[color:var(--scene-inspector-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,239,242,0.92))] text-[color:var(--scene-inspector-ink)] shadow-[0_14px_24px_rgba(31,25,20,0.08),inset_0_1px_0_rgba(255,255,255,0.96),inset_0_-1px_0_rgba(51,42,31,0.08)] hover:border-[color:var(--scene-inspector-border-strong)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(242,243,246,0.96))] hover:shadow-[0_18px_28px_rgba(31,25,20,0.12),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(51,42,31,0.08)] hover:scale-[1.03]"
        }
        ${className}
      `}
      {...props}
    >
      {icon}
      {badge && (
        <span className="pointer-events-none absolute -right-1 -top-1 rounded-full border border-[#E8B65A] bg-[#FFF4CC] px-1.5 py-[1px] text-[8px] font-bold uppercase tracking-[0.14em] text-[#7A5612] shadow-[0_8px_12px_rgba(0,0,0,0.12)]">
          {badge}
        </span>
      )}
      {label && (
        <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-full border border-[color:var(--scene-inspector-border)] bg-[rgba(252,251,248,0.96)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--scene-inspector-ink)] opacity-0 shadow-[0_12px_18px_rgba(31,25,20,0.08)] transition-opacity group-hover:opacity-100 sm:block">
          {label}
        </span>
      )}
    </button>
  );
}
