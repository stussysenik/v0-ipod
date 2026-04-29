import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { screenChromeTokens } from "@/lib/design-system";

function TokenLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/6 py-2 text-xs">
      <span className="font-semibold text-[#111315]">{label}</span>
      <code className="text-right text-black/58">{String(value)}</code>
    </div>
  );
}

function ScreenChromeBoard() {
  return (
    <div className="w-[min(1080px,94vw)] space-y-8 text-left">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
          Product Chrome Source
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#111315]">
          `scripts/design-system.json`
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-black/66">
          These product manifest values feed the current screen frame, glass overlay,
          status divider, play indicator, battery chrome, progress footer, and progress
          track styling in the live build.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[24px] border border-black/10 bg-white/90 p-5 shadow-[0_18px_36px_rgba(0,0,0,0.07)]">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-black/54">
            Frame
          </h3>
          <TokenLine label="liveShadow" value={screenChromeTokens.frame.liveShadow} />
          <TokenLine label="exportShadow" value={screenChromeTokens.frame.exportShadow} />
          <TokenLine
            label="glassOverlayLive"
            value={screenChromeTokens.frame.glassOverlayLive}
          />
          <TokenLine
            label="glassOverlayExport"
            value={screenChromeTokens.frame.glassOverlayExport}
          />
        </article>

        <article className="rounded-[24px] border border-black/10 bg-white/90 p-5 shadow-[0_18px_36px_rgba(0,0,0,0.07)]">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-black/54">
            Status Bar
          </h3>
          <TokenLine label="divider" value={screenChromeTokens.statusBar.divider} />
          <TokenLine
            label="playIndicator"
            value={screenChromeTokens.statusBar.playIndicator}
          />
          <TokenLine
            label="battery.border"
            value={screenChromeTokens.statusBar.battery.border}
          />
          <TokenLine
            label="battery.background"
            value={screenChromeTokens.statusBar.battery.background}
          />
          <TokenLine
            label="battery.fillFrom"
            value={screenChromeTokens.statusBar.battery.fillFrom}
          />
          <TokenLine
            label="battery.fillTo"
            value={screenChromeTokens.statusBar.battery.fillTo}
          />
        </article>

        <article className="rounded-[24px] border border-black/10 bg-white/90 p-5 shadow-[0_18px_36px_rgba(0,0,0,0.07)]">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-black/54">
            Progress
          </h3>
          <TokenLine
            label="footerBackground"
            value={screenChromeTokens.progress.footerBackground}
          />
          <TokenLine
            label="trackBorder"
            value={screenChromeTokens.progress.trackBorder}
          />
          <TokenLine
            label="trackBackground"
            value={screenChromeTokens.progress.trackBackground}
          />
          <TokenLine
            label="fillBackground"
            value={screenChromeTokens.progress.fillBackground}
          />
          <TokenLine
            label="fillHighlight"
            value={screenChromeTokens.progress.fillHighlight}
          />
        </article>
      </section>
    </div>
  );
}

const meta = {
  title: "scripts/design-system/ScreenChrome",
  component: ScreenChromeBoard,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof ScreenChromeBoard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ManifestBoard: Story = {};
