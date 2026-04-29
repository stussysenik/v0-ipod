"use client";

export function IpodGlassOverlay({ exportSafe = false }: { exportSafe?: boolean }) {
  const glassOverlay = {
    background: exportSafe
      ? "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.04) 100%)"
      : "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 30%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.05) 100%)",
  };

  return (
    <>
      {/* Primary surface reflection */}
      <div
        className="pointer-events-none absolute inset-0"
        style={glassOverlay}
        aria-hidden="true"
      />

      {/* Soft top-left window reflection */}
      <div
        className="pointer-events-none absolute left-[5%] top-[4%] h-[40%] w-[50%] rounded-[20px] opacity-20"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0) 65%)",
        }}
        aria-hidden="true"
      />

      {/* Internal "LCD depth" vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: "inset 0 1px 4px rgba(0,0,0,0.15)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
