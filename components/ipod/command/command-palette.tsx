"use client";

import { Command } from "cmdk";
import { useEffect, useMemo, useState } from "react";

import { IpodStoreContext } from "@/lib/xstate/store";
import { buildCommands } from "./command-registry";

/**
 * Global ⌘K / Ctrl+K command palette (spec: command-palette). Mounted once inside the
 * store provider. Opens from any view mode, closes on Escape (Radix restores focus to the
 * prior surface), and is fully keyboard-operable with fuzzy search via `cmdk`. The command
 * list is rebuilt from live machine state on every render.
 */
export function CommandPalette() {
	const [open, setOpen] = useState(false);
	const { send } = IpodStoreContext.useActorRef();
	const viewMode = IpodStoreContext.useSelector((s) => s.context.presentation.viewMode);
	const layout = IpodStoreContext.useSelector((s) => s.context.panelLayout);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setOpen((prev) => !prev);
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, []);

	const commands = buildCommands({ viewMode, layout, send, close: () => setOpen(false) });
	const groups = useMemo(() => {
		const byGroup = new Map<string, typeof commands>();
		for (const cmd of commands) {
			const list = byGroup.get(cmd.group) ?? [];
			list.push(cmd);
			byGroup.set(cmd.group, list);
		}
		return Array.from(byGroup.entries());
	}, [commands]);

	return (
		<Command.Dialog
			open={open}
			onOpenChange={setOpen}
			label="Command palette"
			overlayClassName="fixed inset-0 z-[190] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in"
			contentClassName="fixed left-1/2 top-[18%] z-[200] w-[min(92vw,560px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-[#D0D4DA] bg-[#F4F4F2]/95 shadow-[0_28px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl"
		>
			<Command.Input
				placeholder="Type a command or search…"
				className="w-full border-b border-black/10 bg-transparent px-4 py-3.5 text-[15px] text-black/85 outline-none placeholder:text-black/35"
			/>
			<Command.List className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain p-2">
				<Command.Empty className="px-3 py-6 text-center text-[13px] text-black/40">
					No matching commands.
				</Command.Empty>
				{groups.map(([group, items]) => (
					<Command.Group
						key={group}
						heading={group}
						className="px-1 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/35 [&_[cmdk-group-items]]:mt-1 [&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:gap-0.5"
					>
						{items.map((cmd) => (
							<Command.Item
								key={cmd.id}
								value={cmd.label}
								keywords={cmd.keywords}
								onSelect={cmd.run}
								className="cursor-pointer rounded-lg px-3 py-2 text-[13px] font-medium text-black/75 data-[selected=true]:bg-blue-100 data-[selected=true]:text-blue-700"
							>
								{cmd.label}
							</Command.Item>
						))}
					</Command.Group>
				))}
			</Command.List>
		</Command.Dialog>
	);
}
