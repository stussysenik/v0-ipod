import { cn } from "@/lib/utils";

export interface SceneBreadcrumbItem {
  id: string;
  label: string;
}

interface SceneBreadcrumbsProps {
  items: readonly SceneBreadcrumbItem[];
  className?: string;
}

export function SceneBreadcrumbs({ items, className }: SceneBreadcrumbsProps) {
  if (items.length === 0) {
    return (
      <div
        className={cn("text-[11px] text-[var(--scene-inspector-ink-muted)]", className)}
      >
        No node selected
      </div>
    );
  }

  return (
    <nav
      aria-label="Selected scene path"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-[var(--scene-inspector-ink-muted)]",
        className,
      )}
    >
      {items.map((item, index) => (
        <span key={item.id} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span
              aria-hidden="true"
              className="text-[10px] text-[var(--scene-inspector-border-strong)]"
            >
              /
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-full border px-2 py-0.5",
              index === items.length - 1
                ? "border-[var(--scene-inspector-border-strong)] bg-[var(--scene-inspector-accent-soft)] text-[var(--scene-inspector-ink)]"
                : "border-[var(--scene-inspector-border)] bg-white/55",
            )}
          >
            {item.label}
          </span>
        </span>
      ))}
    </nav>
  );
}
