'use client';

import { createInitialIpodWorkbenchModel } from '@ipod/lib/ipod-state/update';
import { createActorContext } from '@xstate/react';
import { ipodCentralMachine } from './central-machine';

export const IpodStoreContext = createActorContext(ipodCentralMachine);

export function IpodStoreProvider({ children }: { children: React.ReactNode }) {
	return (
		<IpodStoreContext.Provider options={{ input: createInitialIpodWorkbenchModel() }}>
			{children}
		</IpodStoreContext.Provider>
	);
}
