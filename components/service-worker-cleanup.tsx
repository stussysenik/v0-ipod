"use client";

import { useEffect } from "react";

export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    const cleanup = async () => {
      let hadRegistrations = false;
      let hadCaches = false;

      try {
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
      } catch {}

      if ("caches" in window) {
        try {
          const keys = await caches.keys();
          hadCaches = keys.length > 0;
          await Promise.all(keys.map((key) => caches.delete(key)));
        } catch {}
      }

      if (!cancelled && (hadRegistrations || hadCaches)) {
        const reloadFlag = "ipodSnapshotCacheResetDone";
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
  }, []);

  return null;
}
