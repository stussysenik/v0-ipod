"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import {
	Button,
	type ButtonProps,
	ToggleButton,
	ToggleButtonGroup,
} from "react-aria-components";

import { IPOD_CLASSIC_MM } from "@/lib/ipod-classic-presets";
import {
	type ControlTokens,
	controlTokenVars,
	solveControlTokens,
} from "@/lib/studio-control-tokens";
import { cn } from "@/lib/utils";

/**
 * The precision-instrument control language. One radius, one type scale, one accent, one
 * timing table — every studio surface composes these instead of ad-hoc Tailwind strings.
 *
 * Color is never authored here: each primitive reads the solved control tokens as CSS
 * custom properties (`--studio-*`) emitted by `StudioControlScope`, which derives them as
 * a pure function of the active stage background. Selection is a *solid fill* (real
 * affordance), resting is a hairline. Behavior (keyboard/focus/ARIA) is React Aria.
 */

// Corner radius bound to the device radius family: the body corner is 6.4mm and the
// screen aperture corner 3.0mm — a ~0.47 inner:outer ratio. Controls take that ratio
// against the 1rem base unit (≈8px), so their corners echo the machined device instead
// of an ad-hoc rounded-xl.
export const CONTROL_RADIUS = Math.round(
	(IPOD_CLASSIC_MM.screen.cornerRadius / IPOD_CLASSIC_MM.body.cornerRadius) * 16,
);

/**
 * The radius of a *surface* that holds controls (a bar, a dock, a tray).
 *
 * Concentric corners: an outer corner is only parallel to the corner it wraps when it
 * equals the inner radius plus the padding between them. Our surfaces pad their controls
 * by `p-1` (4px), so the surface corner is `CONTROL_RADIUS + 4`. Anything else — and a
 * `rounded-full` pill especially — reads as a default shape bolted around a machined one.
 * This is the rectangle language: crisp corners from the device's own radius family
 * (body 6.4mm : aperture 3.0mm), never a stadium.
 */
export const SURFACE_PAD = 4;
export const SURFACE_RADIUS = CONTROL_RADIUS + SURFACE_PAD;

// One timing table. Hover is a quick acknowledgement; selection is a deliberate state
// change. Ease-out, no bounce — an instrument, not a toy.
const HOVER_MS = 130;
const SELECT_MS = 220;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** CSS var with a light-stage fallback so primitives render correctly outside a scope. */
const v = (name: string, fallback: string) => `var(${name}, ${fallback})`;
const SURFACE = v("--studio-surface", "#FDFDFD");
const HAIRLINE = v("--studio-hairline", "#D7D8D9");
const LABEL = v("--studio-label", "#10141A");
const ACCENT = v("--studio-accent", "#0048FF");
const SELECTED_FILL = v("--studio-selected-fill", "#0048FF");
const SELECTED_LABEL = v("--studio-selected-label", "#F4F6F8");
const FOCUS_RING = v("--studio-focus-ring", "#0048FF");

const focusRing = (isFocusVisible: boolean): CSSProperties =>
	isFocusVisible
		? { boxShadow: `0 0 0 2px ${SURFACE}, 0 0 0 4px ${FOCUS_RING}` }
		: {};

/**
 * Emits the solved control tokens as CSS custom properties on a wrapping element. Wrap
 * any studio surface in this (passing the active stage background) and every nested
 * `Studio*` primitive inherits a contrast-guaranteed, stage-relative palette.
 */
export function StudioControlScope({
	stageBackground,
	children,
	style,
	tokens,
	...rest
}: Omit<HTMLAttributes<HTMLDivElement>, "style"> & {
	stageBackground: string;
	children: ReactNode;
	style?: CSSProperties;
	/** Pre-solved tokens (skip the solve); falls back to solving `stageBackground`. */
	tokens?: ControlTokens;
}) {
	const vars = controlTokenVars(tokens ?? solveControlTokens(stageBackground));
	return (
		<div {...rest} style={{ ...vars, ...style } as CSSProperties}>
			{children}
		</div>
	);
}

/** Tracked small-caps section label — the studio's one label voice. */
export function StudioLabel({
	children,
	className,
	style,
}: {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}) {
	return (
		<span
			className={cn(
				"block text-[11px] font-bold uppercase tracking-[0.1em] opacity-70",
				className,
			)}
			style={{ color: LABEL, ...style }}
		>
			{children}
		</span>
	);
}

const baseControl = "inline-flex items-center justify-center gap-2 font-semibold leading-none outline-none select-none";

const BUTTON_SIZES = {
	sm: "text-[11px] px-3 py-2.5",
	md: "text-[13px] px-4 py-3.5",
} as const;

export interface StudioButtonProps extends Omit<ButtonProps, "className" | "style"> {
	variant?: "secondary" | "primary";
	size?: keyof typeof BUTTON_SIZES;
	/** Selectable affordance: when true the button shows the solved solid fill. */
	isActive?: boolean;
	fullWidth?: boolean;
	className?: string;
	children?: ReactNode;
}

/**
 * Action button. `primary` is always a solid accent fill; `secondary` is a hairline
 * surface. Pass `isActive` for a selectable (one-or-none) control whose selected state
 * is the same solved solid fill — affordance via fill, never a bare border swap.
 */
export function StudioButton({
	variant = "secondary",
	size = "sm",
	isActive = false,
	fullWidth = false,
	className,
	children,
	...props
}: StudioButtonProps) {
	const filled = variant === "primary" || isActive;
	return (
		<Button
			{...props}
			className={cn(baseControl, BUTTON_SIZES[size], fullWidth ? "w-full" : "flex-1", className)}
			style={({ isHovered, isPressed, isFocusVisible, isDisabled }) => ({
				borderRadius: CONTROL_RADIUS,
				border: "1px solid",
				borderColor: filled ? SELECTED_FILL : HAIRLINE,
				background: filled ? SELECTED_FILL : SURFACE,
				color: filled ? SELECTED_LABEL : LABEL,
				opacity: isDisabled ? 0.5 : isHovered ? 0.92 : 1,
				transform: isPressed ? "scale(0.98)" : "scale(1)",
				transition: `background ${SELECT_MS}ms ${EASE}, color ${SELECT_MS}ms ${EASE}, border-color ${SELECT_MS}ms ${EASE}, opacity ${HOVER_MS}ms ${EASE}, transform ${HOVER_MS}ms ${EASE}`,
				cursor: isDisabled ? "not-allowed" : "pointer",
				...focusRing(isFocusVisible),
			})}
		>
			{children}
		</Button>
	);
}

export interface StudioSegmentOption<T extends string> {
	value: T;
	label: ReactNode;
}

/**
 * Single-select segmented control. The active segment is a solved *solid fill*; resting
 * segments are hairline surfaces — selection reads as a fill change, never a border swap.
 */
export function StudioSegment<T extends string>({
	options,
	value,
	onChange,
	"aria-label": ariaLabel,
	className,
}: {
	options: readonly StudioSegmentOption<T>[];
	value: T;
	onChange: (value: T) => void;
	"aria-label": string;
	className?: string;
}) {
	return (
		<ToggleButtonGroup
			aria-label={ariaLabel}
			selectionMode="single"
			disallowEmptySelection
			selectedKeys={[value]}
			onSelectionChange={(keys) => {
				const next = [...keys][0] as T | undefined;
				if (next && next !== value) onChange(next);
			}}
			className={cn("flex gap-2", className)}
		>
			{options.map((opt) => (
				<ToggleButton
					key={opt.value}
					id={opt.value}
					className={cn(baseControl, "flex-1 text-[11px] px-3 py-2.5")}
					style={({ isSelected, isHovered, isPressed, isFocusVisible }) => ({
						borderRadius: CONTROL_RADIUS,
						border: "1px solid",
						borderColor: isSelected ? SELECTED_FILL : HAIRLINE,
						background: isSelected ? SELECTED_FILL : SURFACE,
						color: isSelected ? SELECTED_LABEL : LABEL,
						opacity: !isSelected && isHovered ? 0.9 : 1,
						transform: isPressed ? "scale(0.98)" : "scale(1)",
						transition: `background ${SELECT_MS}ms ${EASE}, color ${SELECT_MS}ms ${EASE}, border-color ${SELECT_MS}ms ${EASE}, opacity ${HOVER_MS}ms ${EASE}, transform ${HOVER_MS}ms ${EASE}`,
						cursor: "pointer",
						...focusRing(isFocusVisible),
					})}
				>
					{opt.label}
				</ToggleButton>
			))}
		</ToggleButtonGroup>
	);
}

/**
 * Selectable swatch chip: shows a color and, when selected, an accent ring + check. The
 * fill is the swatch's own color; the accent ring carries the selection affordance.
 */
export function StudioChip({
	color,
	isSelected,
	onPress,
	label,
	size = 28,
}: {
	color: string;
	isSelected: boolean;
	onPress: () => void;
	label: string;
	size?: number;
}) {
	return (
		<ToggleButton
			isSelected={isSelected}
			onPress={onPress}
			aria-label={label}
			className="relative shrink-0 outline-none"
			style={({ isHovered, isPressed, isFocusVisible }) => ({
				width: size,
				height: size,
				borderRadius: 9999,
				background: color,
				border: "1px solid",
				borderColor: isSelected ? ACCENT : HAIRLINE,
				boxShadow: isSelected ? `0 0 0 2px ${ACCENT}` : "none",
				transform: isPressed ? "scale(0.95)" : isHovered ? "scale(1.06)" : "scale(1)",
				transition: `transform ${HOVER_MS}ms ${EASE}, box-shadow ${SELECT_MS}ms ${EASE}, border-color ${SELECT_MS}ms ${EASE}`,
				cursor: "pointer",
				...focusRing(isFocusVisible),
			})}
		>
			{isSelected && (
				<span
					className="absolute inset-0 flex items-center justify-center text-[12px] font-bold"
					style={{ color: SELECTED_LABEL, mixBlendMode: "difference" }}
					aria-hidden
				>
					✓
				</span>
			)}
		</ToggleButton>
	);
}

/** Monospace value field — surfaces a precise value (hex, percentage, count). */
export function StudioField({
	children,
	className,
	style,
}: {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center px-2 py-1 text-[11px] font-mono font-semibold tabular-nums",
				className,
			)}
			style={{
				borderRadius: CONTROL_RADIUS,
				border: `1px solid ${HAIRLINE}`,
				background: SURFACE,
				color: LABEL,
				...style,
			}}
		>
			{children}
		</span>
	);
}

/** Label / value / control row — the studio's one inspector-line layout. */
export function StudioRow({
	label,
	children,
	className,
}: {
	label: ReactNode;
	children?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex items-center justify-between gap-3 py-1.5", className)}>
			<StudioLabel className="mb-0 normal-case tracking-normal opacity-80">{label}</StudioLabel>
			{children}
		</div>
	);
}
