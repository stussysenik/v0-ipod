import React from "react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  isActive?: boolean;
  contrast?: boolean;
}

export function IconButton({
  icon,
  label,
  isActive,
  contrast,
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={props["aria-label"] ?? label}
      className={`
        relative group flex items-center justify-center w-10 h-10 rounded-full
        transition-all duration-300 ease-out
        ${
          isActive
            ? "bg-black text-white scale-110 shadow-lg"
            : contrast
              ? "bg-black text-white hover:bg-zinc-800 hover:scale-110 hover:shadow-md"
              : "bg-white/90 text-black hover:bg-white hover:scale-110 hover:shadow-md"
        }
        ${className}
      `}
      {...props}
    >
      {icon}
      {label && (
        <span className="absolute right-full mr-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {label}
        </span>
      )}
    </button>
  );
}
