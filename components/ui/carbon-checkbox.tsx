"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Carbon Design System Checkbox
 * Following IBM Carbon Design System specifications
 */
const CarbonCheckbox = React.forwardRef<
	React.ElementRef<typeof CheckboxPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
	<CheckboxPrimitive.Root
		ref={ref}
		className={cn(
			// Base styles
			"peer h-4 w-4 shrink-0 rounded-sm border transition-all duration-150",
			// Default state - Carbon grey-60 border
			"border-[#8D8D8D] bg-white",
			// Hover state - Carbon grey-50
			"hover:border-[#8D8D8D]",
			// Focus state - Carbon focus color
			"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F62FE] focus-visible:ring-offset-2",
			// Disabled state - Carbon grey-30
			"disabled:cursor-not-allowed disabled:border-[#C6C6C6] disabled:bg-[#F4F4F4]",
			// Checked state - Carbon black background
			"data-[state=checked]:bg-[#000000] data-[state=checked]:border-[#000000]",
			// Checked disabled state
			"data-[state=checked]:disabled:bg-[#C6C6C6] data-[state=checked]:disabled:border-[#C6C6C6]",
			className,
		)}
		{...props}
	>
		<CheckboxPrimitive.Indicator
			className={cn("flex items-center justify-center text-white")}
		>
			<Check className="h-3 w-3 stroke-[3]" />
		</CheckboxPrimitive.Indicator>
	</CheckboxPrimitive.Root>
));

CarbonCheckbox.displayName = "CarbonCheckbox";

/**
 * Carbon Checkbox with Label
 */
interface CarbonCheckboxWithLabelProps extends React.ComponentPropsWithoutRef<
	typeof CheckboxPrimitive.Root
> {
	label: string;
	helperText?: string;
}

function CarbonCheckboxWithLabel({
	label,
	helperText,
	className,
	...props
}: CarbonCheckboxWithLabelProps) {
	return (
		<div className={cn("flex items-start gap-3", className)}>
			<CarbonCheckbox {...props} />
			<div className="flex flex-col gap-1">
				<label
					className="text-sm font-normal text-[#161616] cursor-pointer leading-4"
					htmlFor={props.id}
				>
					{label}
				</label>
				{helperText && (
					<span className="text-xs text-[#6F6F6F]">{helperText}</span>
				)}
			</div>
		</div>
	);
}

const CarbonCheckboxWithStatics = Object.assign(CarbonCheckbox, {
	WithLabel: CarbonCheckboxWithLabel,
});

export { CarbonCheckboxWithStatics as CarbonCheckbox };
