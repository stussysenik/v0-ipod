"use client";

import React from "react";

interface AppErrorBoundaryProps {
	/** Names the crashed surface in the fallback copy (e.g. "customizer", "3D stage"). */
	label: string;
	children: React.ReactNode;
}

interface AppErrorBoundaryState {
	error: Error | null;
}

/**
 * Render-time exceptions must never white-screen silently: the fallback is
 * observable (`data-testid="app-error-fallback"`) so the rapid-interaction
 * suite can assert it stays absent, and recoverable via a state reset that
 * remounts the subtree (spec: interaction-robustness).
 */
export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
	state: AppErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
		return { error };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		console.error(`[app-error-boundary:${this.props.label}]`, error, info.componentStack);
	}

	render() {
		if (!this.state.error) return this.props.children;
		return (
			<div
				data-testid="app-error-fallback"
				role="alert"
				className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 p-6 text-center"
			>
				<p className="text-sm opacity-70">
					The {this.props.label} hit an unexpected error.
				</p>
				<button
					type="button"
					className="rounded-md border border-current/20 px-4 py-2 text-sm"
					onClick={() => this.setState({ error: null })}
				>
					Try again
				</button>
			</div>
		);
	}
}
