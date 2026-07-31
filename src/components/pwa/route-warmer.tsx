"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

const CORE_ROUTES = [
  "/students",
  "/custom-fields",
  "/vault",
  "/vault/manage",
  "/documents",
  "/settings",
  "/settings/about",
];

export function RouteWarmer() {
  const router = useRouter();

  React.useEffect(() => {
    // Only prefetch when client is online and window is loaded
    if (typeof window === "undefined" || !navigator.onLine) return;

    const timer = setTimeout(() => {
      for (const route of CORE_ROUTES) {
        try {
          router.prefetch(route);
          fetch(route, { cache: "force-cache" }).catch(() => {});
        } catch {
          // Ignore prefetch failures
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
