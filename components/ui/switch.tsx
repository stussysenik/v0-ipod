"use client";

import { Switch as RACSwitch } from "react-aria-components";

import { cn } from "@/lib/utils";

interface SwitchProps {
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	isDisabled?: boolean;
	className?: string;
	"aria-label"?: string;
}

/**
 * Toggle switch on the canonical React Aria headless layer. Keeps the prior
 * `checked` / `onCheckedChange` prop names so existing callers are unaffected, and reads
 * the one solved accent (`--studio-accent`) for its on-state.
 */
function Switch({ checked, onCheckedChange, isDisabled, className, ...props }: SwitchProps) {
	return (
		<RACSwitch
			{...props}
			isSelected={checked}
			isDisabled={isDisabled}
			onChange={onCheckedChange}
			className={cn("group inline-flex shrink-0 cursor-pointer items-center", className)}
		>
			<span className="relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent bg-[#726F73] transition-colors duration-200 group-data-[selected]:bg-[color:var(--studio-accent,#0048FF)] group-data-[disabled]:cursor-not-allowed group-data-[disabled]:opacity-50 group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-[color:var(--studio-focus-ring,#0048FF)] group-data-[focus-visible]:ring-offset-2 group-data-[focus-visible]:ring-offset-white">
				<span className="pointer-events-none block h-5 w-5 translate-x-0 rounded-full bg-white shadow-lg transition-transform duration-200 group-data-[selected]:translate-x-5" />
			</span>
		</RACSwitch>
	);
}

export { Switch };
