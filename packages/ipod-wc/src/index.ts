/**
 * Entry point for the published `<ipod-classic>` element. Importing this module
 * registers the element as a side effect — the plain-HTML embed path:
 *
 *   <script type="module" src="ipod-classic.js"></script>
 *   <ipod-classic src="/my.feed.json"></ipod-classic>
 */

import { defineIpodClassic, IpodClassicElement } from "./ipod-classic";

defineIpodClassic();

export { IpodClassicElement, defineIpodClassic };
export type { IpodFeed } from "./ipod-classic";
