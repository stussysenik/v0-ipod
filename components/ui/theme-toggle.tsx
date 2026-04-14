"use client";

import { IPOD_6G_COLORS, type IPodTheme } from "@/hooks/use-ipod-theme";
import { cn } from "@/lib/utils";

import { Switch } from "./switch";

interface ThemeToggleProps {
	theme: IPodTheme;
	onToggle: () => void;
	className?: string;
	showLabel?: boolean;
}

/**
 * ThemeToggle Component
 * Carbon Design System + Addy Osmani patterns
 * - Compound component pattern for flexibility
 * - Clear separation of presentation and logic
 */
export function ThemeToggle({ theme, onToggle, className, showLabel = true }: ThemeToggleProps) {
	const isBlack = theme === "black";
	const _caseColor = isBlack ? IPOD_6G_COLORS.case.black : IPOD_6G_COLORS.case.white;

	return (
		<div
			className={cn(
				"flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
				"border-[#E0E0E0] bg-white hover:border-[#C6C6C6]",
				className,
			)}
		>
			<div className="flex items-center gap-3 flex-1">
				{/* White indicator */}
				<div
					className={cn(
						"w-8 h-8 rounded-full border-2 transition-all duration-200",
						!isBlack
							? "border-[#000000] scale-110"
							: "border-[#C6C6C6]",
					)}
					style={{ backgroundColor: IPOD_6G_COLORS.case.white }}
					title="White iPod"
				/>

				{/* Toggle Switch */}
				<Switch
					aria-label={`Switch to ${isBlack ? "White" : "Black"} iPod`}
					checked={isBlack}
					onCheckedChange={onToggle}
				/>

				{/* Black indicator */}
				<div
					className={cn(
						"w-8 h-8 rounded-full border-2 transition-all duration-200",
						isBlack
							? "border-[#000000] scale-110"
							: "border-[#C6C6C6]",
					)}
					style={{ backgroundColor: IPOD_6G_COLORS.case.black }}
					title="Black iPod"
				/>
			</div>

			{showLabel && (
				<span className="text-sm font-medium text-[#161616] min-w-[60px] text-right">
					{isBlack ? "Black" : "White"}
				</span>
			)}
		</div>
	);
}

/**
 * ThemeToggle.Group - Compound component for multiple theme options
 * Following Addy Osmani: Flexible component APIs
 */
interface ThemeGroupProps {
	children: React.ReactNode;
	className?: string;
}

function ThemeGroup({ children, className }: ThemeGroupProps) {
	return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
}

ThemeToggle.Group = ThemeGroup;

export default ThemeToggle;
