/**
 * Type declarations for static asset imports (PNG, JPG, etc.)
 *
 * next-env.d.ts (which references next/image-types/global) is excluded from git
 * because Next.js regenerates it on every build. These declarations ensure
 * `tsc --noEmit` works in CI before the Next.js build has run.
 */

interface StaticImageData {
	src: string;
	height: number;
	width: number;
	blurDataURL?: string;
	blurWidth?: number;
	blurHeight?: number;
}

declare module "*.png" {
	const content: StaticImageData;
	export default content;
}

declare module "*.jpg" {
	const content: StaticImageData;
	export default content;
}

declare module "*.jpeg" {
	const content: StaticImageData;
	export default content;
}

declare module "*.gif" {
	const content: StaticImageData;
	export default content;
}

declare module "*.webp" {
	const content: StaticImageData;
	export default content;
}

declare module "*.avif" {
	const content: StaticImageData;
	export default content;
}

declare module "*.ico" {
	const content: StaticImageData;
	export default content;
}

declare module "*.svg" {
	const content: string;
	export default content;
}
