import { describe, expect, it } from "vitest";

import { EXAMPLE_FEED } from "@/lib/feed/example";

import { focusedNode, initNav, navReducer, type NavState, type PlainNavActionType } from "./machine";

/** Drive a sequence of payload-free actions from the example feed's initial state. */
function run(...types: PlainNavActionType[]): NavState {
	return types.reduce((s, type) => navReducer(s, { type }), initNav(EXAMPLE_FEED));
}

describe("navReducer — list focus", () => {
	it("starts focused on the first root row", () => {
		expect(focusedNode(initNav(EXAMPLE_FEED))?.id).toBe("works");
	});

	it("points focus directly at a row (pointer parity), wrapping out-of-range", () => {
		expect(focusedNode(navReducer(initNav(EXAMPLE_FEED), { type: "focus", index: 2 }))?.id).toBe(
			"contact",
		);
		// out-of-range wraps modulo the row count (3 rows → index 3 = row 0).
		expect(focusedNode(navReducer(initNav(EXAMPLE_FEED), { type: "focus", index: 3 }))?.id).toBe(
			"works",
		);
	});

	it("moves focus with next/prev and wraps like a click wheel", () => {
		// root has 3 nodes: works, about, contact.
		expect(focusedNode(run("next"))?.id).toBe("about");
		expect(focusedNode(run("next", "next"))?.id).toBe("contact");
		expect(focusedNode(run("next", "next", "next"))?.id).toBe("works"); // wrap forward
		expect(focusedNode(run("prev"))?.id).toBe("contact"); // wrap backward
	});
});

describe("navReducer — drill & back", () => {
	it("drills into a submenu and back restores the exact prior focus", () => {
		// Move focus to "about" (idx 1), then back to "works" (idx 0) and drill in.
		const drilled = run("select"); // select "works" → its children
		expect(drilled.stack).toHaveLength(2);
		expect(focusedNode(drilled)?.id).toBe("m-aurora");

		const back = navReducer(drilled, { type: "back" });
		expect(back.stack).toHaveLength(1);
		expect(focusedNode(back)?.id).toBe("works");
	});

	it("preserves focus on the parent frame across a drill round-trip", () => {
		// Focus "works" submenu's second child, open it, close, refocus parent list.
		let s = run("select"); // into works submenu, focus m-aurora
		s = navReducer(s, { type: "next" }); // focus m-trident
		expect(focusedNode(s)?.id).toBe("m-tident");
		s = navReducer(s, { type: "back" }); // back to root, focus still "works"
		expect(focusedNode(s)?.id).toBe("works");
	});

	it("back at the root is a no-op (never pops past root)", () => {
		const s = navReducer(initNav(EXAMPLE_FEED), { type: "back" });
		expect(s.stack).toHaveLength(1);
	});
});

describe("navReducer — select resolves works and links", () => {
	it("selecting a slug node opens the work view by slug", () => {
		// root → works → m-aurora (slug "aurora")
		let s = run("select");
		s = navReducer(s, { type: "select" });
		expect(s.view).toEqual({ kind: "work", slug: "aurora" });
	});

	it("back closes an open work to the menu without disturbing the stack", () => {
		let s = run("select");
		const stackBefore = s.stack;
		s = navReducer(s, { type: "select" }); // open work
		s = navReducer(s, { type: "back" }); // close work
		expect(s.view).toEqual({ kind: "menu" });
		expect(s.stack).toEqual(stackBefore);
	});

	it("selecting a href node emits a pending link the host clears", () => {
		// root focus → contact (idx 2), select → pendingLink.
		let s = run("next", "next", "select");
		expect(s.pendingLink).toBe("mailto:hello@example.com");
		s = navReducer(s, { type: "linkHandled" });
		expect(s.pendingLink).toBeUndefined();
	});

	it("ignores focus moves while a work is open", () => {
		let s = run("select");
		s = navReducer(s, { type: "select" }); // open aurora
		const moved = navReducer(s, { type: "next" });
		expect(moved).toEqual(s);
	});
});
