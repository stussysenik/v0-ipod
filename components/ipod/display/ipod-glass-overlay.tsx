"use client";

export function IpodGlassOverlay({ exportSafe = false }: { exportSafe?: boolean }) {
  const glassOverlay = {
    background: exportSafe
      ? "linear-gradient(152deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.018) 18%, rgba(255,255,255,0) 40%), linear-gradient(180deg, rgba(255,255,255,0.006) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0.025) 100%)"
      : "linear-gradient(152deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.022) 18%, rgba(255,255,255,0) 40%), linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0.03) 100%)",
  };

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={glassOverlay}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-[11px] top-[9px] h-[32%] w-[48%] rounded-[18px] opacity-25"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.024) 18%, rgba(255,255,255,0) 58%)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
