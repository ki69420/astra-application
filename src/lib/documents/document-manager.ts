import { getCachedDocumentBlob, setCachedDocumentBlob, deleteCachedDocumentBlob } from "../document-cache";

export { getCachedDocumentBlob, setCachedDocumentBlob, deleteCachedDocumentBlob };

/**
 * Gets a document Blob from local IndexedDB cache or fetches from server if online, storing it into IndexedDB.
 */
export async function getCachedOrFetchBlob(documentId: string): Promise<Blob | null> {
  if (!documentId) return null;

  // 1. Check local IndexedDB device storage first
  const localBlob = await getCachedDocumentBlob(documentId);
  if (localBlob && localBlob.size > 0) {
    return localBlob;
  }

  // 2. Fetch from server API if online and store into IndexedDB
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return null; // Offline & no local cache available
  }

  try {
    const res = await fetch(`/api/documents/${documentId}/view`);
    if (!res.ok) return null;

    const freshBlob = await res.blob();
    if (freshBlob && freshBlob.size > 0) {
      await setCachedDocumentBlob(documentId, freshBlob);
      return freshBlob;
    }
  } catch {
    // Network error / offline
  }

  return null;
}

/**
 * Background worker to bulk pre-cache document Blobs into IndexedDB while online.
 */
export async function precacheDocumentBlobs(documentIds: string[]): Promise<void> {
  if (typeof window === "undefined" || !documentIds.length) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const uniqueIds = Array.from(new Set(documentIds.filter(Boolean)));

  for (const id of uniqueIds) {
    try {
      const existing = await getCachedDocumentBlob(id);
      if (!existing || existing.size === 0) {
        const res = await fetch(`/api/documents/${id}/view`);
        if (res.ok) {
          const blob = await res.blob();
          if (blob && blob.size > 0) {
            await setCachedDocumentBlob(id, blob);
          }
        }
      }
    } catch {
      // Ignore background precache failures for individual files
    }
  }
}

/**
 * Creates a local Blob Object URL and triggers a 0ms native browser download locally without network requests.
 */
export function triggerLocalDownload(blob: Blob, fileName: string): void {
  if (typeof window === "undefined" || !blob) return;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName || "document";
  anchor.target = "_self";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
