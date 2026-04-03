import { DEFAULT_BACKDROP_COLOR, DEFAULT_SHELL_COLOR } from "@/lib/color-manifest";

export default function Loading() {
  return (
    <main>
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: DEFAULT_BACKDROP_COLOR }}
      >
        <div
          className="rounded-[36px]"
          style={{
            width: 370,
            height: 620,
            backgroundColor: DEFAULT_SHELL_COLOR,
            boxShadow: "0 28px 40px -32px rgba(0,0,0,0.42), 0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid rgba(255,255,255,0.45)",
          }}
        />
      </div>
    </main>
  );
}
