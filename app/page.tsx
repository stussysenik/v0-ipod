import { AppErrorBoundary } from "@/components/app-error-boundary";
import IpodWorkbench from "@/components/ipod/workbench/ipod-workbench";

export default function Home() {
  return (
    <main className="min-h-dvh w-full overflow-hidden">
      <AppErrorBoundary label="customizer">
        <IpodWorkbench />
      </AppErrorBoundary>
    </main>
  );
}
