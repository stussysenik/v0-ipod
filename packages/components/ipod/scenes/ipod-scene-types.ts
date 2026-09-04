'use client';

import type { IpodNowPlayingLayoutElementId } from '@ipod/lib/ipod-state/model';
import type { IpodWorkbenchAction } from '@ipod/lib/ipod-state/update';

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
