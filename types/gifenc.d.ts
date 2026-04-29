declare module "gifenc" {
  export type GifPaletteColor =
    | [number, number, number]
    | [number, number, number, number];
  export type GifPalette = GifPaletteColor[];

	export interface GIFEncoderOptions {
		auto?: boolean;
		initialCapacity?: number;
	}

	export interface GIFEncoderFrameOptions {
		palette?: GifPalette;
		first?: boolean;
		transparent?: boolean;
		transparentIndex?: number;
		delay?: number;
		repeat?: number;
		dispose?: number;
	}

	export interface GIFEncoderInstance {
		readonly buffer: ArrayBuffer;
		writeFrame(
			index: Uint8Array,
			width: number,
			height: number,
			options?: GIFEncoderFrameOptions,
		): void;
		finish(): void;
		bytes(): Uint8Array<ArrayBuffer>;
		bytesView(): Uint8Array<ArrayBuffer>;
		reset(): void;
	}

	export interface QuantizeOptions {
		format?: "rgb565" | "rgb444" | "rgba4444";
		oneBitAlpha?: boolean | number;
		clearAlpha?: boolean;
		clearAlphaThreshold?: number;
		clearAlphaColor?: number;
		useSqrt?: boolean;
	}

	export function GIFEncoder(options?: GIFEncoderOptions): GIFEncoderInstance;
	export function quantize(
		rgba: Uint8Array | Uint8ClampedArray,
		maxColors: number,
		options?: QuantizeOptions,
	): GifPalette;
	export function applyPalette(
		rgba: Uint8Array | Uint8ClampedArray,
		palette: GifPalette,
		format?: "rgb565" | "rgb444" | "rgba4444",
	): Uint8Array<ArrayBuffer>;
}
