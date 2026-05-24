import { cva, type VariantProps } from "class-variance-authority";

export const ipodDeviceVariants = cva("relative flex flex-col items-center", {
	variants: {
		preset: {
			"classic-2007": "bg-silver-classic",
			"classic-2008": "bg-silver-2008",
			"classic-2009": "bg-black-classic",
		},
		viewMode: {
			flat: "scale-100 rotate-0",
			"3d": "perspective-1000 rotate-x-10 rotate-y-5",
			focus: "scale-110",
			preview: "scale-90 opacity-80",
			ascii: "font-mono",
		},
	},
	defaultVariants: {
		preset: "classic-2007",
		viewMode: "flat",
	},
});

export type IpodDeviceVariantsProps = VariantProps<typeof ipodDeviceVariants>;
