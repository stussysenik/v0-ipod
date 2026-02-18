"use client";

import { useEffect } from "react";

interface ServiceWorkerCleanupProps {
  deployVersion?: string;
}

export function ServiceWorkerCleanup({
  deployVersion,
}: ServiceWorkerCleanupProps) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const cleanup = async () => {
      let versionChanged = false;
      let hadRegistrations = false;
      let hadCaches = false;

      if (deployVersion) {
        try {
          const storageKey = "ipodSnapshotDeployVersion";
          const previousVersion = localStorage.getItem(storageKey);
          versionChanged =
            !!previousVersion && previousVersion !== deployVersion;
          localStorage.setItem(storageKey, deployVersion);
        } catch {}
      }

      try {
        if ("serviceWorker" in navigator) {
          const registrations =
            await navigator.serviceWorker.getRegistrations();
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
        const reloadFlag = deployVersion
          ? `ipodSnapshotCacheResetDone:${deployVersion}`
          : "ipodSnapshotCacheResetDone";
        if (!sessionStorage.getItem(reloadFlag)) {
          sessionStorage.setItem(reloadFlag, "1");
          window.location.reload();
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
