/**
 * <ipod-classic> — the framework-native, embeddable iPod.
 *
 * The sellable artifact: a browser-native custom element droppable into any page
 * (blog, Webflow, plain HTML, a car-company demo) that ingests a feed and renders
 * the keep-out stage + browser navigation. It consumes the SAME framework-neutral
 * core as the React workbench — `lib/feed` (data) and `lib/nav` (interaction) — via
 * relative imports, so there is one source of truth and zero React in the published
 * output. It never reads the viewport (container queries only), so it is correct at
 * any embed size.
 *
 * No decorators (the repo tsconfig has no experimentalDecorators) — plain static
 * `properties` + `customElements.define`.
 */

import { html, LitElement, nothing, type PropertyValues, type TemplateResult } from "lit";

import { loadFeed, type NormalizedFeed } from "../../../lib/feed/load";
import { IpodFeedSchema, type IpodFeed, type ThemeTokens } from "../../../lib/feed/schema";
import { themeToCssVars } from "../../../lib/feed/theme";
import {
	focusedNode,
	initNav,
	navReducer,
	type NavAction,
	type NavState,
	type PlainNavActionType,
} from "../../../lib/nav/machine";

import { stageStyles } from "./stage-css";

export class IpodClassicElement extends LitElement {
	static styles = stageStyles;

	static properties = {
		/** A feed object, or a JSON string / URL via the `src` attribute. */
		feed: { type: Object },
		/** Theme token overrides merged over the feed's own theme. */
		theme: { type: Object },
		/** Fetch a feed from this URL (attribute form for plain-HTML embeds). */
		src: { type: String },
	};

	// `declare` (not a real field) so TS's class-field init doesn't shadow Lit's
	// generated reactive accessors under target ES2022 / useDefineForClassFields.
	declare feed?: IpodFeed;
	declare theme?: ThemeTokens;
	declare src?: string;

	// Plain (non-reactive) derived state; render reads these, `_dispatch` requests
	// the re-render explicitly.
	private _model?: NormalizedFeed;
	private _state?: NavState;
	private _error?: string;

	override willUpdate(changed: PropertyValues<this>): void {
		if (changed.has("src") && this.src && !this.feed) {
			void this._fetchFeed(this.src);
		}
		// A feed (re)assignment validates + resets navigation — the feed-swap reset.
		if (changed.has("feed")) {
			this._rebuild();
		}
	}

	private async _fetchFeed(url: string): Promise<void> {
		try {
			const res = await fetch(url);
			this.feed = (await res.json()) as IpodFeed;
		} catch (e) {
			this._error = `Failed to load feed: ${(e as Error).message}`;
		}
	}

	/** Validate + normalize the current feed and reset navigation (feed-swap reset). */
	private _rebuild(): void {
		if (!this.feed) return;
		try {
			this._model = loadFeed(this.feed);
			this._state = initNav(this._model.feed);
			this._error = undefined;
		} catch (e) {
			this._error = (e as Error).message;
			this._model = undefined;
			this._state = undefined;
		}
	}

	private _dispatch(action: NavAction): void {
		if (!this._state) return;
		const next = navReducer(this._state, action);
		// Honor a link intent, then ack so the machine clears it (keeps reducer pure).
		if (next.pendingLink) {
			window.open(next.pendingLink, "_blank", "noopener,noreferrer");
			this._state = navReducer(next, { type: "linkHandled" });
		} else {
			this._state = next;
		}
		this.requestUpdate();
	}

	private _onKeyDown = (e: KeyboardEvent): void => {
		const map: Record<string, PlainNavActionType> = {
			ArrowUp: "prev",
			ArrowDown: "next",
			ArrowLeft: "back",
			ArrowRight: "select",
			Enter: "select",
			" ": "select",
			Backspace: "back",
			Escape: "back",
		};
		const action = map[e.key];
		if (action) {
			e.preventDefault();
			this._dispatch({ type: action });
		}
	};

	override render(): TemplateResult {
		if (this._error) {
			return html`<div class="stage"><div class="device-cell">⚠︎ ${this._error}</div></div>`;
		}
		const model = this._model;
		const state = this._state;
		if (!model || !state) {
			return html`<div class="stage"><div class="device-cell">Loading…</div></div>`;
		}

		const mergedTheme = { ...model.feed.theme, ...this.theme };
		const vars = themeToCssVars(mergedTheme);
		for (const [k, v] of Object.entries(vars)) this.style.setProperty(k, v);

		const frame = state.stack[state.stack.length - 1];
		const focused = focusedNode(state);
		const openWork = state.view.kind === "work" ? model.worksBySlug.get(state.view.slug) : undefined;

		return html`
			<div class="stage">
				<div class="device-cell">
					<div
						class="device"
						tabindex="0"
						role="application"
						aria-label=${`${model.feed.meta.title} — iPod browser`}
						@keydown=${this._onKeyDown}
					>
						<div class="screen">
							<div class="statusbar">
								<span>${frame?.parentId === "root" ? model.feed.meta.title : focused?.label ?? "iPod"}</span>
								<span aria-hidden="true">▶</span>
							</div>
							<div class="body">
								${openWork
									? this._renderPreview(openWork, model)
									: html`<ul class="menu" role="listbox">
											${frame?.nodes.map(
												(node, i) => html`<li
													role="option"
													aria-selected=${i === frame.focus}
													class="row"
													@mouseenter=${() => this._dispatch({ type: "focus", index: i })}
													@click=${() => {
														this._dispatch({ type: "focus", index: i });
														this._dispatch({ type: "select" });
													}}
												>
													<span>${node.label}</span>
													<span class="chevron" aria-hidden="true"
														>${node.children ? "›" : node.href ? "↗" : ""}</span
													>
												</li>`,
											)}
									  </ul>`}
							</div>
						</div>
						<div class="wheel">
							<button class="wbtn wbtn--menu" @click=${() => this._dispatch({ type: "back" })}>MENU</button>
							<button class="wbtn wbtn--prev" aria-label="Previous" @click=${() => this._dispatch({ type: "prev" })}>⏮</button>
							<button class="wbtn wbtn--next" aria-label="Next" @click=${() => this._dispatch({ type: "next" })}>⏭</button>
							<button class="wbtn wbtn--play" aria-label="Play" @click=${() => this._dispatch({ type: "select" })}>⏯</button>
							<button class="center" aria-label="Select" @click=${() => this._dispatch({ type: "select" })}></button>
						</div>
					</div>
				</div>
				${openWork ? this._renderWork(openWork, model) : nothing}
			</div>
		`;
	}

	private _renderPreview(work: IpodFeed["works"][number], model: NormalizedFeed): TemplateResult {
		const cover = model.resolveCover(work);
		return html`<article class="preview">
			${cover
				? html`<img class="preview-cover" src=${cover.src} alt=${cover.alt ?? work.title} />`
				: html`<div class="preview-cover" aria-hidden="true">${work.title.charAt(0)}</div>`}
			<h3 class="preview-title">${work.title}</h3>
			${work.summary ? html`<p class="preview-summary">${work.summary}</p>` : nothing}
		</article>`;
	}

	private _renderWork(work: IpodFeed["works"][number], model: NormalizedFeed): TemplateResult {
		const cover = model.resolveCover(work);
		const meta = [work.year, work.role, ...work.tags].filter(Boolean).join(" · ");
		return html`<section class="work" role="dialog" aria-label=${work.title}>
			<button class="work-back" @click=${() => this._dispatch({ type: "back" })}>← Menu</button>
			<h2 class="work-title">${work.title}</h2>
			${meta ? html`<p class="work-meta">${meta}</p>` : nothing}
			${cover ? html`<img class="work-cover" src=${cover.src} alt=${cover.alt ?? work.title} />` : nothing}
			${work.summary ? html`<p class="work-body">${work.summary}</p>` : nothing}
			${work.body ? html`<div class="work-body">${work.body}</div>` : nothing}
			${work.links.length
				? html`<div class="work-links">
						${work.links.map(
							(l) => html`<a class="work-link" href=${l.href} target="_blank" rel="noopener noreferrer">${l.label} ↗</a>`,
						)}
				  </div>`
				: nothing}
		</section>`;
	}
}

/** Idempotent registration so multiple imports/HMR don't throw. */
export function defineIpodClassic(tag = "ipod-classic"): void {
	if (typeof customElements !== "undefined" && !customElements.get(tag)) {
		customElements.define(tag, IpodClassicElement);
	}
}

/** Re-export the schema so embedders can validate a feed before assigning it. */
export { IpodFeedSchema, type IpodFeed };
