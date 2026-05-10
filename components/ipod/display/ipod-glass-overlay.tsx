"use client";

export function IpodGlassOverlay({ exportSafe = false }: { exportSafe?: boolean }) {
	const glassOverlay = {
		background: exportSafe
			? "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 45%, rgba(255,255,255,0) 55%, rgba(255,255,255,0.06) 100%)"
			: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 35%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.08) 100%)",
	};

	return (
		<>
			{/* Primary surface reflection */}
			<div
				className="pointer-events-none absolute inset-0 z-50"
				style={glassOverlay}
				aria-hidden="true"
			/>

			{/* Iconic diagonal sharp highlight */}
			<div
				className="pointer-events-none absolute inset-0 z-50 overflow-hidden"
				aria-hidden="true"
			>
				<div
					className="absolute h-[200%] w-[120%] -translate-x-[20%] -translate-y-[20%] rotate-[25deg]"
					style={{
						background: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.02) 48%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.02) 52%, transparent 100%)",
					}}
				/>
			</div>

			{/* Soft top-left window reflection - enlarged and softened */}
			<div
				className="pointer-events-none absolute left-[2%] top-[2%] h-[60%] w-[70%] rounded-[30px] opacity-25 z-50 blur-[1px]"
				style={{
					background: "linear-gradient(160deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 30%, rgba(255,255,255,0) 70%)",
				}}
				aria-hidden="true"
			/>

			{/* Environmental bottom-screen dual glare (simulating physical light sources reflecting on convex lens) */}
			{!exportSafe && (
				<div className="pointer-events-none absolute bottom-[10%] left-[8%] z-50 flex gap-4 opacity-40 blur-[2px]" aria-hidden="true">
					<div className="h-6 w-12 rounded-[100%] bg-white/20" />
					<div className="h-6 w-12 rounded-[100%] bg-white/20" />
				</div>
			)}

			{/* Internal "LCD depth" vignette - deepened for authentic 2007 feel, especially top shadow for physical recess */}
			<div
				className="pointer-events-none absolute inset-0 z-50"
				style={{
					boxShadow: "inset 0 3px 8px -2px rgba(0,0,0,0.4), inset 0 0 2px rgba(0,0,0,0.5)",
				}}
				aria-hidden="true"
			/>
		</>
	);
}
