"use client";

import { createElement, useCallback, useEffect, useRef } from "react";
import type {
	IpodNowPlayingLayoutElementId,
	IpodNowPlayingLayoutPosition,
	IpodNowPlayingLayoutState,
} from "@/lib/ipod-state/model";
import type { RenderNowPlayingElement } from "@/components/ipod/scenes/ipod-scene-types";

const DEFAULT_LAYOUT_POSITION: IpodNowPlayingLayoutPosition = { x: 0, y: 0 };

interface NowPlayingDragState {
	elementId: IpodNowPlayingLayoutElementId;
	pointerId: number;
	startClientX: number;
	startClientY: number;
	startPosition: IpodNowPlayingLayoutPosition;
}

function clampDragOffset(value: number, maxDistance: number): number {
	return Math.round(Math.min(Math.max(value, -maxDistance), maxDistance));
}

function getLayoutPosition(
	layout: IpodNowPlayingLayoutState,
	elementId: IpodNowPlayingLayoutElementId,
): IpodNowPlayingLayoutPosition {
	return layout[elementId] ?? DEFAULT_LAYOUT_POSITION;
}

function hasSameLayoutPosition(
	left: IpodNowPlayingLayoutPosition,
	right: IpodNowPlayingLayoutPosition,
): boolean {
	return left.x === right.x && left.y === right.y;
}

export function useIpodNowPlayingLayout(options: {
	isLayoutMode: boolean;
	shouldApplyLayout: boolean;
	layout: IpodNowPlayingLayoutState;
	statusBarHeight: number;
	onLayoutChange?: (nextLayout: IpodNowPlayingLayoutState) => void;
	playClick: () => void;
}): {
	frameRef: React.MutableRefObject<HTMLDivElement | null>;
	renderElement: RenderNowPlayingElement;
} {
	const frameRef = useRef<HTMLDivElement | null>(null);
	const layoutRef = useRef(options.layout);
	const dragRef = useRef<NowPlayingDragState | null>(null);

	useEffect(() => {
		layoutRef.current = options.layout;
	}, [options.layout]);

	const updateLayout = useCallback(
		(
			elementId: IpodNowPlayingLayoutElementId,
			nextPosition: IpodNowPlayingLayoutPosition,
			phase: "move" | "drop",
		) => {
			const currentPosition = getLayoutPosition(layoutRef.current, elementId);
			if (hasSameLayoutPosition(currentPosition, nextPosition)) {
				return;
			}

			const nextLayout = { ...layoutRef.current };
			if (nextPosition.x === 0 && nextPosition.y === 0) {
				delete nextLayout[elementId];
			} else {
				nextLayout[elementId] = nextPosition;
			}

			layoutRef.current = nextLayout;
			options.onLayoutChange?.(nextLayout);
			console.info("[ipod-os-layout]", {
				phase,
				elementId,
				x: nextPosition.x,
				y: nextPosition.y,
			});
		},
		[options],
	);

	useEffect(() => {
		if (!options.isLayoutMode) {
			dragRef.current = null;
			return;
		}

		const handlePointerMove = (event: PointerEvent) => {
			const dragState = dragRef.current;
			const frame = frameRef.current;
			if (!dragState || !frame || event.pointerId !== dragState.pointerId) {
				return;
			}

			const rect = frame.getBoundingClientRect();
			const maxX = Math.max(24, Math.round(rect.width / 2));
			const maxY = Math.max(
				24,
				Math.round((rect.height - options.statusBarHeight) / 2),
			);
			updateLayout(
				dragState.elementId,
				{
					x: clampDragOffset(
						dragState.startPosition.x +
							event.clientX -
							dragState.startClientX,
						maxX,
					),
					y: clampDragOffset(
						dragState.startPosition.y +
							event.clientY -
							dragState.startClientY,
						maxY,
					),
				},
				"move",
			);
		};

		const handlePointerUp = (event: PointerEvent) => {
			const dragState = dragRef.current;
			if (!dragState || event.pointerId !== dragState.pointerId) {
				return;
			}

			const finalPosition = getLayoutPosition(
				layoutRef.current,
				dragState.elementId,
			);
			console.info("[ipod-os-layout]", {
				phase: "drop",
				elementId: dragState.elementId,
				x: finalPosition.x,
				y: finalPosition.y,
			});
			dragRef.current = null;
		};

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", handlePointerUp);
		window.addEventListener("pointercancel", handlePointerUp);

		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
			window.removeEventListener("pointercancel", handlePointerUp);
		};
	}, [options.isLayoutMode, options.statusBarHeight, updateLayout]);

	const startDrag = useCallback(
		(elementId: IpodNowPlayingLayoutElementId) =>
			(event: React.PointerEvent<HTMLDivElement>) => {
				if (!options.isLayoutMode || event.button !== 0) {
					return;
				}

				event.preventDefault();
				event.stopPropagation();
				event.currentTarget.setPointerCapture(event.pointerId);
				options.playClick();
				dragRef.current = {
					elementId,
					pointerId: event.pointerId,
					startClientX: event.clientX,
					startClientY: event.clientY,
					startPosition: getLayoutPosition(
						layoutRef.current,
						elementId,
					),
				};
			},
		[options],
	);

	const renderElement = useCallback<RenderNowPlayingElement>(
		(elementId, children, elementOptions) => {
			const position = options.shouldApplyLayout
				? getLayoutPosition(options.layout, elementId)
				: DEFAULT_LAYOUT_POSITION;

			return createElement(
				"div",
				{
					className: [
						elementOptions?.className,
						options.isLayoutMode
							? "cursor-move touch-none rounded-[2px] outline outline-1 outline-dashed outline-[#5AA0DF]/65"
							: "",
					]
						.filter(Boolean)
						.join(" "),
					style: {
						...elementOptions?.style,
						transform:
							position.x === 0 && position.y === 0
								? undefined
								: `translate(${position.x}px, ${position.y}px)`,
					},
					"data-testid": elementOptions?.testId,
					"data-layout-element": elementId,
					"data-layout-x": position.x,
					"data-layout-y": position.y,
					onPointerDown: options.isLayoutMode
						? startDrag(elementId)
						: undefined,
				},
				children,
			);
		},
		[options, startDrag],
	);

	return {
		frameRef,
		renderElement,
	};
}
