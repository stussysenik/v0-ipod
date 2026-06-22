"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { IpodStoreContext } from "@ipod/lib/xstate/store";
import { buildCommands, type PaletteCommand } from "./command-registry";

function groupBy(commands: PaletteCommand[]): [string, PaletteCommand[]][] {
	const byGroup = new Map<string, PaletteCommand[]>();
	for (const cmd of commands) {
		const list = byGroup.get(cmd.group) ?? [];
		list.push(cmd);
		byGroup.set(cmd.group, list);
	}
	return Array.from(byGroup.entries());
}

/**
 * Global ⌘K / Ctrl+K command palette (spec: command-palette). Mounted once inside the
 * store provider. Opens from any view mode, closes on Escape (Radix restores focus to the
 * prior surface), and is fully keyboard-operable with fuzzy search via `cmdk`. The command
 * list is rebuilt from live machine state on every render.
 *
 * Two-tier triage: only `primary` commands show immediately. `secondary` commands stay behind
 * a "more" toggle so the default list reads as "what matters" — but typing a query reveals
 * every tier so nothing is ever unreachable.
 */
export function CommandPalette() {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [showSecondary, setShowSecondary] = useState(false);
	const router = useRouter();
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

	// Reset triage state on every open so each ⌘K starts from the curated primary list.
	const onOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) {
			setSearch("");
			setShowSecondary(false);
		}
	};

	const commands = buildCommands({
		viewMode,
		layout,
		send,
		navigate: (href) => router.push(href),
		close: () => onOpenChange(false),
	});

	// A query reveals every tier (searching should never hide a match); an empty query honors
	// the "more" toggle. The toggle row only earns its place when there is something to reveal.
	const searching = search.trim().length > 0;
	const secondaryCount = useMemo(
		() => commands.filter((c) => c.tier === "secondary").length,
		[commands],
	);
	const revealSecondary = searching || showSecondary;
	const visible = revealSecondary ? commands : commands.filter((c) => c.tier === "primary");
	const groups = useMemo(() => groupBy(visible), [visible]);

	return (
		<Command.Dialog
			open={open}
			onOpenChange={onOpenChange}
			label="Command palette"
			overlayClassName="fixed inset-0 z-[190] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in"
			contentClassName="fixed left-1/2 top-[18%] z-[200] w-[min(92vw,560px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-[#D0D4DA] bg-[#F4F4F2]/95 shadow-[0_28px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl"
		>
			<Command.Input
				value={search}
				onValueChange={setSearch}
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
				{!searching && secondaryCount > 0 && (
					<Command.Item
						value="__toggle_secondary__"
						keywords={["more", "less", "secondary", "advanced", "all", "commands"]}
						onSelect={() => setShowSecondary((prev) => !prev)}
						className="mt-1 cursor-pointer rounded-lg px-3 py-2 text-[12px] font-medium text-black/45 data-[selected=true]:bg-black/[0.06] data-[selected=true]:text-black/70"
					>
						{showSecondary
							? "Show fewer commands"
							: `Show ${secondaryCount} more command${secondaryCount === 1 ? "" : "s"}…`}
					</Command.Item>
				)}
			</Command.List>
		</Command.Dialog>
	);
}
