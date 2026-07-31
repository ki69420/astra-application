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
    // Only prefetch when client is online
    if (typeof window === "undefined" || !navigator.onLine) return;

    const timer = setTimeout(() => {
      for (const route of CORE_ROUTES) {
        try {
          router.prefetch(route);
        } catch {
          // Ignore prefetch failures
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
