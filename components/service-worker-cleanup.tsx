"use client";

import { useEffect } from "react";

interface ServiceWorkerCleanupProps {
  deployVersion?: string;
}

interface NextDataWindow extends Window {
  __NEXT_DATA__?: {
    buildId?: string;
  };
}

function resolveDeployVersion(explicitDeployVersion?: string): string {
  if (explicitDeployVersion && explicitDeployVersion !== "dev") {
    return explicitDeployVersion;
  }

  if (typeof window === "undefined") {
    return explicitDeployVersion ?? "dev";
  }

  const nextData = window as NextDataWindow;
  const runtimeBuildId = nextData.__NEXT_DATA__?.buildId;
  if (runtimeBuildId) {
    return runtimeBuildId;
  }

  return explicitDeployVersion ?? "dev";
}

export function ServiceWorkerCleanup({ deployVersion }: ServiceWorkerCleanupProps) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const cleanup = async () => {
      let versionChanged = false;
      let hadRegistrations = false;
      let hadCaches = false;
      const effectiveDeployVersion = resolveDeployVersion(deployVersion);

      try {
        const storageKey = "ipodSnapshotDeployVersion";
        const previousVersion = localStorage.getItem(storageKey);
        versionChanged =
          !!previousVersion && previousVersion !== effectiveDeployVersion;
        localStorage.setItem(storageKey, effectiveDeployVersion);
      } catch {}

      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          hadRegistrations = registrations.length > 0;

          await Promise.all(
            registrations.map(async (registration) => {
              try {
                await registration.update();
              } catch {}
              try {
                await registration.unregister();
              } catch {}
            }),
          );
        }
      } catch {}

      if ("caches" in window) {
        try {
          const keys = await caches.keys();
          hadCaches = keys.length > 0;
          await Promise.all(keys.map((key) => caches.delete(key)));
        } catch {}
      }

      if (!cancelled && (hadRegistrations || hadCaches || versionChanged)) {
        const reloadFlag = `ipodSnapshotCacheResetDone:${effectiveDeployVersion}`;
        if (!sessionStorage.getItem(reloadFlag)) {
          sessionStorage.setItem(reloadFlag, "1");
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set("__v", effectiveDeployVersion);
          window.location.replace(nextUrl.toString());
        }
        return;
      }

      if (!cancelled) {
        const cleanUrl = new URL(window.location.href);
        if (cleanUrl.searchParams.has("__v")) {
          cleanUrl.searchParams.delete("__v");
          window.history.replaceState(null, "", cleanUrl.toString());
        }
      }
    };

    cleanup();

    return () => {
      cancelled = true;
    };
  }, [deployVersion]);

  return null;
}
