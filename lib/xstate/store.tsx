"use client";

import { createActorContext } from "@xstate/react";
import { ipodCentralMachine } from "./central-machine";
import { createInitialIpodWorkbenchModel } from "@/lib/ipod-state/update";

export const IpodStoreContext = createActorContext(ipodCentralMachine);

export function IpodStoreProvider({ children }: { children: React.ReactNode }) {
	return (
		<IpodStoreContext.Provider options={{ input: createInitialIpodWorkbenchModel() }}>
			{children}
		</IpodStoreContext.Provider>
	);
}
