import { css, unsafeCSS } from "lit";
import { UNO_CSS } from "./uno-generated";

/**
 * Keep-out stage CSS for the shadow root — the JS-free mirror of
 * `lib/layout/keepout.ts` and `app/globals.css`'s `.keepout-stage`, scoped to the
 * element. The device owns its grid cell; rails own others; sizing resolves against
 * the host container (`container-type: inline-size`), never the viewport. `--ipod-*`
 * theme tokens are read straight off the host, so a feed swap re-skins everything.
 */
// UnoCSS-generated utilities are prepended first so bespoke geometry rules
// (lower in this block) win specificity conflicts, matching shadow-dom intent.
export const stageStyles = [
	unsafeCSS(UNO_CSS),
	css`
	:host {
		display: block;
		container: ipod-stage / inline-size;
		inline-size: 100%;
		font-family: var(--ipod-font-sans, system-ui, sans-serif);
		color: var(--ipod-foreground, #f5f5f7);
	}
	* { box-sizing: border-box; }

	.stage {
		position: relative;
		inline-size: 100%;
		aspect-ratio: var(--ipod-stage-aspect, 3 / 4);
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: auto auto;
		grid-template-areas: "device" "rail-bottom";
		gap: clamp(8px, 2cqi, 16px);
		padding: clamp(8px, 2cqi, 20px);
		background: var(--ipod-background, #000);
	}
	.device-cell {
		grid-area: device;
		display: grid;
		place-items: center;
		min-inline-size: 0;
		min-block-size: 0;
	}
	.rail {
		grid-area: rail-bottom;
		min-inline-size: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
		justify-content: center;
		overflow: auto hidden;
	}
	.rail:empty { display: none; }

	@container ipod-stage (min-width: 560px) {
		.stage {
			grid-template-columns: var(--ipod-rail-w, 18%) 1fr var(--ipod-rail-w, 18%);
			grid-template-rows: 1fr auto;
			grid-template-areas: "rail-left device rail-right" "rail-left rail-bottom rail-right";
		}
	}

	.device {
		/* Real iPod classic body, 61.8 × 103.5mm (IPOD_CLASSIC_MM) — not an invented form. */
		aspect-ratio: 618 / 1035;
		inline-size: min(78cqi, 320px);
		block-size: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		/* Asymmetric reveals from Apple's drawing (mm ÷ 61.8 width; padding % is width-rel):
		   top 4.95 · sides 4.9 · bottom 11.4. */
		padding: 8% 7.9% 18.4%;
		/* Equal 6.4mm machined corner (slash keeps the arc circular, not stretched). */
		border-radius: 10.4% / 6.2%;
		background: linear-gradient(155deg, #f7f7f9, #d8d9dd 60%, #c4c5ca);
		box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 18px 50px rgba(0, 0, 0, 0.55);
	}
	@container ipod-stage (min-width: 560px) {
		.device { block-size: min(100%, 720px); inline-size: auto; }
	}
	.device:focus-visible { outline: 2px solid var(--ipod-accent, #0048ff); outline-offset: 3px; }

	.screen {
		/* Real screen aperture: 52 × 39.5mm (~4:3) across the 84% content width — a fixed
		   upper-face window, not a panel stretched to the wheel. */
		flex: 0 0 auto;
		inline-size: 100%;
		aspect-ratio: 52 / 39.5;
		min-block-size: 0;
		border-radius: 4.8%;
		background: var(--ipod-surface, #0b0b0d);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) inset;
	}
	.statusbar {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.6cqi 2.4cqi;
		font-size: clamp(9px, 3cqi, 13px);
		font-weight: 600;
		background: var(--ipod-accent, #0048ff);
		color: #fff;
	}
	.body { flex: 1 1 auto; min-block-size: 0; overflow: hidden; position: relative; }

	.menu { block-size: 100%; overflow-y: auto; list-style: none; margin: 0; padding: 0; }
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 2.2cqi 2.8cqi;
		font-size: clamp(11px, 3.4cqi, 15px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		cursor: pointer;
	}
	.row[aria-selected="true"] { background: var(--ipod-accent, #0048ff); color: #fff; }
	.chevron { opacity: 0.5; font-size: 0.9em; }

	.wheel {
		flex: 0 0 auto;
		aspect-ratio: 1;
		/* Ø38mm wheel = 73% of the 52mm content width; 9.65mm control gap = 18.5% above. */
		inline-size: 73.1%;
		margin-top: 18.5%;
		align-self: center;
		border-radius: 50%;
		position: relative;
		background: radial-gradient(circle at 50% 35%, #fbfbfc, #d2d3d8 70%, #bcbdc2);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35), 0 1px 0 rgba(255, 255, 255, 0.8) inset;
		display: grid;
		place-items: center;
		color: #4a4b50;
		font-size: clamp(8px, 2.6cqi, 12px);
		font-weight: 700;
		user-select: none;
	}
	.wbtn { position: absolute; background: none; border: 0; color: inherit; font: inherit; cursor: pointer; padding: 6px 10px; }
	.wbtn--menu { top: 6%; left: 50%; transform: translateX(-50%); }
	.wbtn--prev { left: 5%; top: 50%; transform: translateY(-50%); }
	.wbtn--next { right: 5%; top: 50%; transform: translateY(-50%); }
	.wbtn--play { bottom: 6%; left: 50%; transform: translateX(-50%); }
	.center {
		/* Ø13.7mm select button = 36% of the Ø38mm wheel. */
		inline-size: 36%;
		aspect-ratio: 1;
		border-radius: 50%;
		border: 0;
		cursor: pointer;
		background: radial-gradient(circle at 50% 35%, #fff, #e6e7ea 70%, #d2d3d8);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) inset;
	}

	.preview { display: flex; flex-direction: column; gap: 6px; block-size: 100%; padding: 3cqi; overflow-y: auto; }
	.preview-cover {
		inline-size: 100%;
		aspect-ratio: 16 / 10;
		border-radius: 2cqi;
		display: grid;
		place-items: center;
		font-size: clamp(20px, 9cqi, 40px);
		font-weight: 800;
		color: var(--ipod-accent, #4d82ff);
		background: rgba(77, 130, 255, 0.15);
	}
	.preview-title { font-size: clamp(13px, 4cqi, 18px); font-weight: 700; margin: 0; }
	.preview-summary { font-size: clamp(10px, 3cqi, 13px); line-height: 1.45; margin: 0; }

	.work {
		position: absolute;
		inset: 0;
		z-index: 5;
		background: var(--ipod-background, #000);
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: clamp(16px, 4cqi, 40px);
		overflow-y: auto;
	}
	.work-back {
		align-self: flex-start;
		background: rgba(255, 255, 255, 0.1);
		border: 0;
		border-radius: 999px;
		color: inherit;
		cursor: pointer;
		font: inherit;
		padding: 7px 16px;
	}
	.work-title { font-size: clamp(24px, 6cqi, 44px); font-weight: 800; margin: 0; line-height: 1.05; }
	.work-meta { color: var(--ipod-muted, #8a8a8e); font-size: 14px; }
	.work-body { max-inline-size: 68ch; line-height: 1.6; white-space: pre-wrap; }
	.work-links { display: flex; flex-wrap: wrap; gap: 10px; }
	.work-link { text-decoration: none; color: var(--ipod-foreground, #fff); background: rgba(77, 130, 255, 0.28); padding: 9px 18px; border-radius: 999px; }
`];
