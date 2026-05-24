import { createMachine, assign } from "xstate";
import { Effect, Console } from "effect";
import type { IpodWorkbenchModel, IpodMachineEvent } from "@/types/ipod";

export const ipodCentralMachine = createMachine(
	{
		id: "ipodCentral",
		types: {} as {
			context: IpodWorkbenchModel;
			events: IpodMachineEvent;
		},
		initial: "idle",
		context: ({ input }: { input: IpodWorkbenchModel }) => input,
		states: {
			idle: {
				on: {
					PLAY_PAUSE: {
						target: "playing",
						actions: "logPlay",
					},
					SET_VIEW_MODE: {
						actions: "updateViewMode",
					},
				},
			},
			playing: {
				on: {
					TICK: {
						actions: "incrementTime",
					},
					PLAY_PAUSE: "idle",
				},
			},
		},
	},
	{
		actions: {
			logPlay: () => {
				// Example of using Effect.ts for side effects
				const program = Console.log("iPod started playing");
				Effect.runSync(program);
			},
			updateViewMode: assign(({ event }) => {
				if (event.type === "SET_VIEW_MODE") {
					return {
						presentation: {
							// This is a simplified merge, usually we'd deep merge or use a lens
							viewMode: event.mode,
						},
					} as any;
				}
				return {};
			}),
			incrementTime: assign(({ context }) => {
				const nextTime = context.playback.currentTime + 1;
				return {
					playback: {
						...context.playback,
						currentTime: nextTime > context.playback.duration ? 0 : nextTime,
					},
				};
			}),
		},
	},
);
