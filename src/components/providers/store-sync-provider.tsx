"use client";
import * as React from "react";
import { useAppStore, type StudentRow, type HomepageField, type SearchableField, type CustomField } from "@/lib/store/use-app-store";

interface StoreSyncProviderProps {
  initialStudents?: StudentRow[];
  initialHomepageFields?: HomepageField[];
  initialSearchableFields?: SearchableField[];
  initialCustomFields?: CustomField[];
  children: React.ReactNode;
}

export function StoreSyncProvider({
  initialStudents,
  initialHomepageFields,
  initialSearchableFields,
  initialCustomFields,
  children,
}: StoreSyncProviderProps) {
  const hydrateStore = useAppStore((s) => s.hydrateStore);
  const isInitialized = useAppStore((s) => s.isInitialized);
  const checkAndSyncBackground = useAppStore((s) => s.checkAndSyncBackground);
  const textSize = useAppStore((s) => s.textSize);

  // Sync root font size attribute data-text-size for app-wide text scaling
  React.useEffect(() => {
    document.documentElement.setAttribute("data-text-size", textSize || "normal");
  }, [textSize]);

  React.useEffect(() => {
    if (!isInitialized && initialStudents && initialHomepageFields && initialSearchableFields) {
      hydrateStore({
        students: initialStudents,
        homepageFields: initialHomepageFields,
        searchableFields: initialSearchableFields,
        customFields: initialCustomFields,
      });
    }
  }, [
    isInitialized,
    initialStudents,
    initialHomepageFields,
    initialSearchableFields,
    initialCustomFields,
    hydrateStore,
  ]);

  // Periodic and tab-focus background sync check
  React.useEffect(() => {
    const handleFocus = () => {
      checkAndSyncBackground();
    };

    window.addEventListener("focus", handleFocus);
    const interval = setInterval(() => {
      checkAndSyncBackground();
    }, 25000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [checkAndSyncBackground]);

  return <>{children}</>;
}
