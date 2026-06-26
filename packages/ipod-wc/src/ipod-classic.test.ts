import { afterEach, describe, expect, it } from "vitest";

import { EXAMPLE_FEED } from "../../../lib/feed/example";
import type { IpodFeed } from "../../../lib/feed/schema";

import { defineIpodClassic, IpodClassicElement } from "./index";

defineIpodClassic();

function mount(feed: IpodFeed): IpodClassicElement {
	const el = document.createElement("ipod-classic") as IpodClassicElement;
	el.feed = feed;
	document.body.appendChild(el);
	return el;
}

afterEach(() => {
	document.body.innerHTML = "";
});

describe("<ipod-classic>", () => {
	it("upgrades to the custom element class", () => {
		expect(customElements.get("ipod-classic")).toBe(IpodClassicElement);
		const el = mount(EXAMPLE_FEED);
		expect(el).toBeInstanceOf(IpodClassicElement);
	});

	it("renders the feed's root menu into its shadow root", async () => {
		const el = mount(EXAMPLE_FEED);
		await el.updateComplete;
		const rows = el.shadowRoot!.querySelectorAll(".row");
		expect(rows.length).toBe(EXAMPLE_FEED.menu.length);
		expect(el.shadowRoot!.textContent).toContain("Works");
		// status bar shows the feed title at the root frame
		expect(el.shadowRoot!.querySelector(".statusbar")!.textContent).toContain(EXAMPLE_FEED.meta.title);
	});

	it("re-renders when the feed is swapped (white-label reactivity)", async () => {
		const el = mount(EXAMPLE_FEED);
		await el.updateComplete;
		expect(el.shadowRoot!.textContent).toContain("Works");

		const swapped: IpodFeed = {
			version: 1,
			meta: { id: "other", title: "Other Brand" },
			theme: { accent: "#FF0000" },
			menu: [{ id: "only", label: "Only Section", slug: "solo" }],
			works: [{ slug: "solo", title: "Solo", tags: [], links: [] }],
			assets: [],
		};
		el.feed = swapped;
		await el.updateComplete;

		const rows = el.shadowRoot!.querySelectorAll(".row");
		expect(rows.length).toBe(1);
		expect(el.shadowRoot!.textContent).toContain("Only Section");
		expect(el.shadowRoot!.textContent).not.toContain("Works");
	});

	it("surfaces a validation error instead of throwing on a bad feed", async () => {
		const el = document.createElement("ipod-classic") as IpodClassicElement;
		// version 99 fails the schema; the element must render an error, not crash.
		el.feed = { version: 99 } as unknown as IpodFeed;
		document.body.appendChild(el);
		await el.updateComplete;
		expect(el.shadowRoot!.textContent).toContain("Invalid IpodFeed");
	});
});
