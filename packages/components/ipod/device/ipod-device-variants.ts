import { cva, type VariantProps } from "class-variance-authority";

export const ipodDeviceVariants = cva(
	"relative flex flex-col items-center transition-all duration-500 ease-in-out", 
	{
		variants: {
			preset: {
				"classic-2007": "bg-neutral-200",
				"classic-2008": "bg-neutral-300",
				"classic-2009": "bg-neutral-900",
				"custom": "", // Color handled by inline vars
			},
			viewMode: {
				flat: "scale-100 rotate-0 shadow-xl",
				"3d": "perspective-1200 [transform:rotateX(12deg)_rotateY(-10deg)_rotateZ(2deg)] shadow-2xl",
				focus: "scale-110 z-50",
				preview: "scale-95 opacity-90 blur-[1px]",
				ascii: "font-mono scale-100",
			},
			materiality: {
				physical: "is-physical",
				flat: "is-flat-vector",
			}
		},
		compoundVariants: [
			{
				viewMode: "ascii",
				className: "bg-black text-green-500 !shadow-none ring-1 ring-green-900",
			},
			{
				viewMode: "3d",
				materiality: "physical",
				className: "ring-1 ring-white/10",
			}
		],
		defaultVariants: {
			preset: "classic-2007",
			viewMode: "flat",
			materiality: "physical",
		},
	}
);

export type IpodDeviceVariantsProps = VariantProps<typeof ipodDeviceVariants>;
