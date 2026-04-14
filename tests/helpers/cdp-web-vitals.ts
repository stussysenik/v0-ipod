import type { CDPSession, Page } from "@playwright/test";

export interface WebVitalsMetrics {
	lcp: number | null;
	fcp: number | null;
	cls: number | null;
	ttfb: number | null;
}

/**
 * Collects Core Web Vitals via Chrome DevTools Protocol.
 *
 * Usage:
 *   const collector = await WebVitalsCollector.create(page);
 *   await page.goto(url);
 *   await page.waitForLoadState("networkidle");
 *   const metrics = await collector.collectAll();
 *   await collector.dispose();
 *
 * Must be created BEFORE `page.goto()` so that `addInitScript`
 * observers are present when the document starts loading.
 */
export class WebVitalsCollector {
	private cdp: CDPSession;
	private page: Page;

	private constructor(page: Page, cdp: CDPSession) {
		this.page = page;
		this.cdp = cdp;
	}

	/**
	 * Create a new collector. Must be called BEFORE page.goto()
	 * because it needs to inject PerformanceObserver scripts that
	 * run at document-start.
	 */
	static async create(page: Page): Promise<WebVitalsCollector> {
		const cdp = await page.context().newCDPSession(page);
		const collector = new WebVitalsCollector(page, cdp);
		await collector.injectObservers();
		return collector;
	}

	/**
	 * Inject PerformanceObserver scripts via page.addInitScript
	 * to capture LCP, FCP, and CLS from the browser's native APIs.
	 *
	 * LCP: PerformanceObserver type 'largest-contentful-paint', read last entry's startTime
	 * FCP: performance.getEntriesByType('paint'), find 'first-contentful-paint' entry
	 * CLS: PerformanceObserver type 'layout-shift', sum values where hadRecentInput === false
	 */
	async injectObservers(): Promise<void> {
		await this.page.addInitScript(() => {
			/* eslint-disable @typescript-eslint/no-explicit-any */
			const w = window as any;
			w.__webVitals = {
				lcp: null as number | null,
				fcp: null as number | null,
				cls: 0,
				lcpEntries: [] as PerformanceEntry[],
			};

			// --- LCP ---
			try {
				const lcpObserver = new PerformanceObserver((list) => {
					const entries = list.getEntries();
					if (entries.length > 0) {
						const last = entries.at(-1);
						w.__webVitals.lcp = last.startTime;
						w.__webVitals.lcpEntries.push(last);
					}
				});
				lcpObserver.observe({
					type: "largest-contentful-paint",
					buffered: true,
				});
			} catch {
				// Not supported in this browser context
			}

			// --- CLS ---
			try {
				const clsObserver = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						const layoutShift = entry as any;
						if (!layoutShift.hadRecentInput) {
							w.__webVitals.cls += layoutShift.value;
						}
					}
				});
				clsObserver.observe({ type: "layout-shift", buffered: true });
			} catch {
				// Not supported in this browser context
			}

			// --- FCP (fallback read via paint timing) ---
			try {
				const fcpObserver = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						if (entry.name === "first-contentful-paint") {
							w.__webVitals.fcp = entry.startTime;
						}
					}
				});
				fcpObserver.observe({ type: "paint", buffered: true });
			} catch {
				// Not supported in this browser context
			}
			/* eslint-enable @typescript-eslint/no-explicit-any */
		});
	}

	/**
	 * Collect paint metrics after page load.
	 * Uses Runtime.evaluate to read the injected observer data,
	 * with a fallback to performance.getEntriesByType('paint') for FCP.
	 */
	async collectPaintMetrics(): Promise<{ fcp: number | null; lcp: number | null }> {
		const result = await this.cdp.send("Runtime.evaluate", {
			expression: `(() => {
        const wv = window.__webVitals;
        if (!wv) return JSON.stringify({ fcp: null, lcp: null });

        let fcp = wv.fcp;
        // Fallback: read FCP from performance timeline directly
        if (fcp === null) {
          const paintEntries = performance.getEntriesByType('paint');
          const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
          if (fcpEntry) fcp = fcpEntry.startTime;
        }

        return JSON.stringify({ fcp: fcp ?? null, lcp: wv.lcp ?? null });
      })()`,
			returnByValue: true,
		});

		const raw = result.result.value as string | undefined;
		if (!raw) return { fcp: null, lcp: null };

		try {
			return JSON.parse(raw) as { fcp: number | null; lcp: number | null };
		} catch {
			return { fcp: null, lcp: null };
		}
	}

	/**
	 * Collect CLS after page load and interactions settle.
	 * Returns the cumulative layout shift score (0 if none occurred).
	 */
	async collectCLS(): Promise<number> {
		const result = await this.cdp.send("Runtime.evaluate", {
			expression: `(() => {
        const wv = window.__webVitals;
        return wv ? wv.cls : 0;
      })()`,
			returnByValue: true,
		});

		const { value } = result.result;
		return typeof value === "number" ? value : 0;
	}

	/**
	 * Collect TTFB from the Navigation Timing API.
	 * Uses: performance.getEntriesByType('navigation')[0].responseStart
	 */
	async collectTTFB(): Promise<number> {
		const result = await this.cdp.send("Runtime.evaluate", {
			expression: `(() => {
        const nav = performance.getEntriesByType('navigation');
        if (nav.length === 0) return 0;
        return nav[0].responseStart || 0;
      })()`,
			returnByValue: true,
		});

		const { value } = result.result;
		return typeof value === "number" ? value : 0;
	}

	/**
	 * Measure INP (Interaction to Next Paint) for a specific interaction.
	 *
	 * 1. Injects a PerformanceObserver for 'event' entries with durationThreshold: 0
	 * 2. Executes the provided interaction function
	 * 3. Waits a frame for entries to flush
	 * 4. Reads back the longest event duration
	 */
	async measureINP(interactionFn: () => Promise<void>): Promise<number> {
		// Step 1: Inject an event-timing observer
		await this.cdp.send("Runtime.evaluate", {
			expression: `(() => {
        window.__webVitals_inp = { maxDuration: 0 };
        try {
          const obs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > window.__webVitals_inp.maxDuration) {
                window.__webVitals_inp.maxDuration = entry.duration;
              }
            }
          });
          obs.observe({ type: 'event', buffered: false, durationThreshold: 0 });
          window.__webVitals_inp._observer = obs;
        } catch (e) {
          // event timing not supported
        }
      })()`,
			returnByValue: true,
		});

		// Step 2: Execute the interaction
		await interactionFn();

		// Step 3: Wait for entries to flush (two animation frames)
		await this.page.evaluate(
			() =>
				new Promise<void>((resolve) =>
					requestAnimationFrame(() =>
						requestAnimationFrame(() => resolve()),
					),
				),
		);

		// Step 4: Read the longest event duration
		const result = await this.cdp.send("Runtime.evaluate", {
			expression: `(() => {
        const inp = window.__webVitals_inp;
        if (!inp) return 0;

        // Disconnect the observer to prevent further accumulation
        if (inp._observer) {
          inp._observer.disconnect();
          delete inp._observer;
        }

        return inp.maxDuration || 0;
      })()`,
			returnByValue: true,
		});

		const { value } = result.result;
		return typeof value === "number" ? value : 0;
	}

	/**
	 * Collect all available metrics after page load.
	 * Call this after the page is fully loaded and visually stable.
	 */
	async collectAll(): Promise<WebVitalsMetrics> {
		const [paintMetrics, cls, ttfb] = await Promise.all([
			this.collectPaintMetrics(),
			this.collectCLS(),
			this.collectTTFB(),
		]);

		return {
			lcp: paintMetrics.lcp,
			fcp: paintMetrics.fcp,
			cls,
			ttfb,
		};
	}

	/**
	 * Clean up the CDP session. Call this in afterEach / test teardown.
	 */
	async dispose(): Promise<void> {
		try {
			await this.cdp.detach();
		} catch {
			// Session may already be closed if the page was closed first
		}
	}
}
