"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { Button } from "@cloudflare/kumo/components/button";
import { Collapsible } from "@cloudflare/kumo/components/collapsible";
import {
  PanelRightOpen,
  PanelRightClose,
  Settings2,
  Waypoints,
  Focus,
  History,
} from "lucide-react";
import { SceneBreadcrumbs, type SceneBreadcrumbItem } from "./scene-breadcrumbs";
import { cn } from "@/lib/utils";

interface SceneInspectorShellProps {
  compact: boolean;
  open: boolean;
  controlsOpen: boolean;
  onToggleShell: () => void;
  onToggleControls: () => void;
  selectedNodeLabel: string;
  profileLabel: string;
  viewModeLabel: string;
  interactionLabel: string;
  exportPresetLabel: string;
  breadcrumbs: readonly SceneBreadcrumbItem[];
  controlsPanel: ReactNode;
  actionsPanel: ReactNode;
  treePanel: ReactNode;
  nodePanel: ReactNode;
  historyPanel: ReactNode;
  toolsRef?: RefObject<HTMLDivElement | null>;
}

function ShellSectionLabel({
  icon,
  eyebrow,
  title,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="scene-inspector-card flex h-10 w-10 items-center justify-center rounded-full text-[var(--scene-inspector-ink)]">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--scene-inspector-ink-muted)]">
          {eyebrow}
        </div>
        <div className="text-[14px] font-semibold text-[var(--scene-inspector-ink)]">
          {title}
        </div>
      </div>
    </div>
  );
}

export function SceneInspectorShell({
  compact,
  open,
  controlsOpen,
  onToggleShell,
  onToggleControls,
  selectedNodeLabel,
  profileLabel,
  viewModeLabel,
  interactionLabel,
  exportPresetLabel,
  breadcrumbs,
  controlsPanel,
  actionsPanel,
  treePanel,
  nodePanel,
  historyPanel,
  toolsRef,
}: SceneInspectorShellProps) {
  const [treeOpen, setTreeOpen] = useState(false);
  const [nodeOpen, setNodeOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (compact) {
      setHistoryOpen(false);
    }
  }, [compact]);

  const controlsButton = compact ? (
    <Button
      data-testid="theme-button"
      onClick={onToggleControls}
      variant={controlsOpen ? "primary" : "secondary"}
      icon={<Settings2 size={16} />}
      className={cn(
        "inline-flex min-w-[10rem] items-center justify-center rounded-full border px-4 py-2 text-[12px] font-semibold shadow-[0_10px_24px_rgba(31,25,20,0.08)]",
        controlsOpen
          ? "border-[var(--scene-inspector-border-strong)] bg-[var(--scene-inspector-accent-soft)] text-[var(--scene-inspector-ink)]"
          : "border-[var(--scene-inspector-border)] bg-white/78 text-[var(--scene-inspector-ink)]",
      )}
    >
      {controlsOpen ? "Hide Options" : "Customize"}
    </Button>
  ) : (
    <Button
      aria-label={controlsOpen ? "Hide scene controls" : "Open scene controls"}
      data-testid="theme-button"
      onClick={onToggleControls}
      shape="circle"
      size="lg"
      variant={controlsOpen ? "primary" : "secondary"}
      icon={<Settings2 size={18} />}
      className={cn(
        "scene-inspector-orb inline-flex h-14 w-14 items-center justify-center text-[var(--scene-inspector-ink)]",
        controlsOpen
          ? "border-[var(--scene-inspector-border-strong)] bg-[var(--scene-inspector-accent-soft)]"
          : "border-[var(--scene-inspector-border)]",
      )}
    />
  );

  return (
    <div
      ref={toolsRef}
      className={cn(
        "z-50",
        compact
          ? "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]"
          : "fixed right-6 top-6 w-[20rem]",
      )}
    >
      {compact ? (
        <div className="flex justify-end pb-3">
          <Button
            aria-label={open ? "Hide scene inspector" : "Open scene inspector"}
            data-testid="toolbox-toggle-button"
            onClick={onToggleShell}
            shape="circle"
            size="lg"
            variant={open ? "primary" : "secondary"}
            icon={open ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-full border text-[var(--scene-inspector-ink)] shadow-[0_18px_32px_rgba(28,24,18,0.24)]",
              open
                ? "border-[var(--scene-inspector-border-strong)] bg-[var(--scene-inspector-accent-soft)]"
                : "border-[var(--scene-inspector-border)] bg-[var(--scene-inspector-surface)]",
            )}
          />
        </div>
      ) : null}

      <aside
        data-testid="toolbox-panel"
        data-compact={compact ? "true" : "false"}
        className={cn(
          "scene-inspector-shell flex flex-col gap-3 transition-all duration-[var(--scene-inspector-duration)] ease-[var(--scene-inspector-ease)]",
          compact
            ? cn(
                "max-h-[min(80dvh,46rem)] origin-bottom",
                open
                  ? "visible translate-y-0 opacity-100"
                  : "pointer-events-none invisible translate-y-6 opacity-0",
              )
            : "max-h-[calc(100dvh-3rem)] w-full",
        )}
      >
        {!compact ? <div className="flex justify-end pr-1">{controlsButton}</div> : null}

        <div
          data-testid="scene-inspector-shell"
          className="flex min-h-0 flex-col gap-3"
        >
          <header className="scene-inspector-pod scene-inspector-pod-strong flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--scene-inspector-ink-muted)]">
                  Kumo Inspector
                </div>
                <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.01em] text-[var(--scene-inspector-ink)]">
                  {selectedNodeLabel}
                </h2>
                <p className="mt-2 max-w-[26ch] text-[11px] leading-[1.45] text-[var(--scene-inspector-ink-muted)]">
                  Choose a view, change the look, then save what you made.
                </p>
              </div>
            </div>

            <SceneBreadcrumbs items={breadcrumbs} className="scene-inspector-subtle-text" />

            <div className="flex flex-wrap gap-2">
              {[
                profileLabel,
                viewModeLabel,
                interactionLabel,
                exportPresetLabel,
              ].map((chip) => (
                <span
                  key={chip}
                  className="scene-inspector-chip px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em]"
                >
                  {chip}
                </span>
              ))}
            </div>

            {compact ? <div className="flex flex-wrap gap-2 pt-1">{controlsButton}</div> : null}
          </header>

          {controlsOpen ? (
            <section
              data-testid="theme-panel"
              className="scene-inspector-pod flex flex-col gap-3 p-5"
            >
              {controlsPanel}
            </section>
          ) : null}

          <section className="scene-inspector-pod flex flex-col gap-3 p-5">
            {actionsPanel}
          </section>

          <div className="no-scrollbar flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
            <div className="scene-inspector-pod p-5">
              <ShellSectionLabel
                icon={<Waypoints size={15} />}
                eyebrow="Stage 1"
                title="Scene Map"
              />
              <Collapsible
                label={treeOpen ? "Collapse tree preview" : "Expand tree preview"}
                open={treeOpen}
                onOpenChange={setTreeOpen}
                className="pt-2"
              >
                <div data-testid="scene-tree-panel">{treePanel}</div>
              </Collapsible>
            </div>

            <div className="scene-inspector-pod p-5">
              <ShellSectionLabel
                icon={<Focus size={15} />}
                eyebrow="Stage 1"
                title="Selected Part"
              />
              <Collapsible
                label={nodeOpen ? "Collapse node panel" : "Expand node panel"}
                open={nodeOpen}
                onOpenChange={setNodeOpen}
                className="pt-2"
              >
                <div data-testid="scene-node-panel">{nodePanel}</div>
              </Collapsible>
            </div>

            <div className="scene-inspector-pod p-5">
              <ShellSectionLabel
                icon={<History size={15} />}
                eyebrow="Stage 1"
                title="Saved Moments"
              />
              <Collapsible
                label={historyOpen ? "Collapse scene history" : "Expand scene history"}
                open={historyOpen}
                onOpenChange={setHistoryOpen}
                className="pt-2"
              >
                <div data-testid="scene-history-panel">{historyPanel}</div>
              </Collapsible>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
