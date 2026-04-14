module.exports = {
	ci: {
		collect: {
			url: ["http://localhost:3000"],
			startServerCommand: "bun run start",
			startServerReadyPattern: "Ready on",
			startServerReadyTimeout: 60000,
			numberOfRuns: 3,
		},
		assert: {
			assertions: {
				"categories:performance": ["warn", { minScore: 0.9 }],
				"categories:accessibility": ["error", { minScore: 0.95 }],
				"categories:best-practices": ["error", { minScore: 0.95 }],
				"categories:seo": ["warn", { minScore: 0.9 }],
				"categories:pwa": ["warn", { minScore: 0.8 }],
				"first-contentful-paint": ["warn", { maxNumericValue: 1500 }],
				"largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
				"cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
				"total-blocking-time": ["warn", { maxNumericValue: 200 }],
			},
		},
		upload: {
			target: "temporary-public-storage",
		},
	},
};
