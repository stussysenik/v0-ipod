"use client";

import type { ReactNode } from "react";
import { Checkbox as RACCheckbox } from "react-aria-components";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

interface CheckboxProps {
	isSelected?: boolean;
	defaultSelected?: boolean;
	isIndeterminate?: boolean;
	isDisabled?: boolean;
	onChange?: (isSelected: boolean) => void;
	value?: string;
	name?: string;
	className?: string;
	children?: ReactNode;
	"aria-label"?: string;
}

/**
 * The single canonical checkbox, on the React Aria headless layer (replacing the prior
 * Radix + duplicate Carbon checkboxes). Checked state uses the one solved accent fill —
 * affordance via fill, consistent with the studio control language.
 */
function Checkbox({ className, children, ...props }: CheckboxProps) {
	return (
		<RACCheckbox
			{...props}
			className={cn("group flex items-center gap-2 text-sm text-[#161616]", className)}
		>
			{({ isSelected, isIndeterminate }) => (
				<>
					<span
						className={cn(
							"flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all duration-150 outline-none",
							"border-[#726F73] bg-white",
							"group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-[color:var(--studio-focus-ring,#0048FF)] group-data-[focus-visible]:ring-offset-2",
							"group-data-[disabled]:cursor-not-allowed group-data-[disabled]:opacity-50",
							(isSelected || isIndeterminate) &&
								"border-[color:var(--studio-accent,#0048FF)] bg-[color:var(--studio-accent,#0048FF)] text-white",
						)}
					>
						{isIndeterminate ? (
							<Minus className="h-3 w-3 stroke-[3]" />
						) : isSelected ? (
							<Check className="h-3 w-3 stroke-[3]" />
						) : null}
					</span>
					{children}
				</>
			)}
		</RACCheckbox>
	);
}

export { Checkbox };
