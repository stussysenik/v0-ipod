"use client";

import type { IpodWorkbenchAction } from "@/lib/ipod-state/update";
import type { IpodNowPlayingLayoutElementId } from "@/lib/ipod-state/model";

export type IpodDisplayDispatch = React.Dispatch<IpodWorkbenchAction>;

export interface RenderNowPlayingElementOptions {
	className?: string;
	style?: React.CSSProperties;
	testId?: string;
}

export type RenderNowPlayingElement = (
	elementId: IpodNowPlayingLayoutElementId,
	children: React.ReactNode,
	options?: RenderNowPlayingElementOptions,
) => React.ReactNode;
