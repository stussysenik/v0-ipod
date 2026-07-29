import { CaseColorReadout } from "@/components/ipod/scenes/ipod-3d-color-cockpit";

import { compatParameters } from "../.storybook/shared";

// `@storybook/nextjs-vite`, not `@storybook/react` — the latter is not a
// dependency of this repo, and `stories/` is excluded from tsc, so the stories
// importing it have never had those types checked.
import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

/** Fixed frame, so the four grades are compared at one width. */
const inPanel: Decorator = (Story) => (
	<div className="w-[300px] rounded-md border border-black/[0.08] bg-white">
		<Story />
	</div>
);

/**
 * The readout grades a case colour on four measured axes and reports the
 * direction of travel from the colour it replaced. Its grade is the worst axis,
 * not an average, so each story below is chosen to bind on a different one —
 * otherwise three of the four grades are unreachable without the 3D scene.
 *
 * Every hex here is a fixed measurement, not a sample: `judgeCaseColor` is pure,
 * so these render identically in the story and in the cockpit.
 */
const meta = {
	title: "iPod/Authoring/Case Colour Readout",
	component: CaseColorReadout,
	tags: ["autodocs"],
	// An authoring-surface control, not product chrome — it has no Figma counterpart.
	parameters: compatParameters("exclude"),
	decorators: [inPanel],
} satisfies Meta<typeof CaseColorReadout>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Grade `exact` — the attested iPod Classic 6G Black. Every axis clears its top
 * band: the manifest attests it, a near-black shell has effectively unbounded
 * highlight headroom, and white wheel labels clear the contrast floor by 16:1.
 */
export const AttestedFinish: Story = {
	args: { hex: "#1c1a1b" },
};

/**
 * Grade `strong` — one 8-bit code off the attested Silver, ΔE00 0.6, which no
 * eye can separate from the real finish. It still reports Custom, because
 * authenticity is an attestation and not a resemblance. This is the story that
 * proves the readout will not launder a lookalike into a provenance claim.
 */
export const Lookalike: Story = {
	args: { hex: "#C0C0C1" },
};

/**
 * Grade `workable` — a house colour. Nothing about it fails; it simply has no
 * heritage, so authenticity binds at ΔE00 3.1 from the nearest shipped finish
 * while the render-side axes stay clear.
 */
export const HouseColour: Story = {
	args: { hex: "#C7C9CD" },
};

/**
 * Grade `poor` — the attested 1st–3rd Gen White. Authentic and still the worst
 * shell in the set to light: headroom 1.00×, so the key light clips the moment
 * it is raised at all and the surface renders as a flat plateau with no form.
 * Authenticity and renderability are independent, and the readout says so.
 */
export const FailingColour: Story = {
	args: { hex: "#FFFFFF" },
};

/** Direction of travel, improving — white to silver trades nothing for headroom. */
export const Improved: Story = {
	args: { hex: "#C0C0C0", previous: "#FFFFFF" },
};

/** Direction of travel, degrading — the same move run backwards. */
export const Degraded: Story = {
	args: { hex: "#FFFFFF", previous: "#C0C0C0" },
};
