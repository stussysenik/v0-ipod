import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { sharedUiTokens } from "@/lib/shared-ui-tokens";

function formatTokenValue(value: unknown): string {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
}

function SharedUiTokensPreview() {
  return (
    <div className="w-[min(860px,92vw)] space-y-6 text-left">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
          Shared Primitive Tokens
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#111315]">
          Repository-owned token manifest
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-black/66">
          Update <code>tokens/shared-ui.json</code>, review the result here, then sync the
          JSON to Tokens Studio / Figma. This page exists so token edits are inspectable
          without opening the full app shell.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(sharedUiTokens.iconButton).map(([key, value]) => (
          <section
            key={key}
            className="overflow-hidden rounded-[24px] border border-black/10 bg-white/85 shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
          >
            <div className="border-b border-black/8 px-5 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-black/54">
                iconButton.{key}
              </h3>
            </div>
            <pre className="overflow-x-auto px-5 py-4 text-xs leading-6 text-[#111315]">
              {formatTokenValue(value)}
            </pre>
          </section>
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: "tokens/shared-ui/Manifest",
  component: SharedUiTokensPreview,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Inspection surface for the shared primitive manifest. Use this to review code-owned token changes before syncing them outward to design tools.",
      },
    },
  },
} satisfies Meta<typeof SharedUiTokensPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Manifest: Story = {};
