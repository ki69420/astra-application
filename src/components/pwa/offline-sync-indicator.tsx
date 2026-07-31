"use client";
import * as React from "react";
import { flushOfflineQueue, getQueuedActions } from "@/lib/sync/offline-queue";

export function OfflineSyncIndicator() {
  const checkQueue = React.useCallback(async () => {
    const items = await getQueuedActions();
    if (items.length > 0 && navigator.onLine) {
      await flushOfflineQueue();
    }
  }, []);

  React.useEffect(() => {
    const handleOnline = () => {
      checkQueue();
    };

    window.addEventListener("online", handleOnline);
    const interval = setInterval(checkQueue, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, [checkQueue]);

  // Hidden indicator (background queue flusher only)
  return null;
}
