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

			{/* Internal "LCD depth" vignette - deepened for authentic 2007 feel */}
			<div
				className="pointer-events-none absolute inset-0 z-50"
				style={{
					boxShadow: "inset 0 1px 6px rgba(0,0,0,0.2), inset 0 0 1px rgba(0,0,0,0.4)",
				}}
				aria-hidden="true"
			/>
		</>
	);
}
