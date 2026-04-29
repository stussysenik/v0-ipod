import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  BACKGROUND_CURATED_FAVORITES,
  CASE_CURATED_FAVORITES,
  getAuthenticFinishes,
} from "@/lib/color-manifest";

function Swatch({ label, hex, note }: { label: string; hex: string; note?: string }) {
  return (
    <div className="rounded-[20px] border border-black/10 bg-white/90 p-3 shadow-[0_14px_26px_rgba(0,0,0,0.06)]">
      <div
        className="h-20 rounded-[14px] border border-black/8"
        style={{ backgroundColor: hex }}
      />
      <div className="mt-3 space-y-1">
        <div className="text-sm font-semibold text-[#111315]">{label}</div>
        <div className="font-mono text-xs text-black/58">{hex}</div>
        {note ? <div className="text-xs leading-5 text-black/58">{note}</div> : null}
      </div>
    </div>
  );
}

function ProductFinishesBoard() {
  const finishGroups = getAuthenticFinishes();

  return (
    <div className="w-[min(1080px,94vw)] space-y-8 text-left">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
          Product Finish Source
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#111315]">
          `scripts/color-manifest.json`
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-black/66">
          This board mirrors the product-owned finish and backdrop data used by the iPod
          assembly. Use it when adjusting hardware finish direction or curated color
          defaults before reviewing the assembled device stories.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[#111315]">Authentic finishes</h3>
        </div>
        {finishGroups.map((group) => (
          <div key={group.generation} className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-black/48">
              {group.generation}
            </h4>
            <div className="grid gap-3 md:grid-cols-3">
              {group.finishes.map((finish) => (
                <Swatch
                  key={finish.id}
                  label={finish.label}
                  hex={finish.hex}
                  note={`${finish.year} · ${finish.notes}`}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#111315]">Curated case favorites</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {CASE_CURATED_FAVORITES.map((favorite) => (
              <Swatch key={favorite.value} label={favorite.label} hex={favorite.value} />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#111315]">
            Curated backdrop favorites
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {BACKGROUND_CURATED_FAVORITES.map((favorite) => (
              <Swatch key={favorite.value} label={favorite.label} hex={favorite.value} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: "scripts/color-manifest/ProductFinishes",
  component: ProductFinishesBoard,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof ProductFinishesBoard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ManifestBoard: Story = {};
