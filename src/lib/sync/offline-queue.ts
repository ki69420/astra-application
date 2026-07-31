const DB_NAME = "astra-offline-queue";
const STORE_NAME = "queue";
const DB_VERSION = 1;

export interface QueuedAction {
  id: string;
  type: string;
  endpoint: string;
  method: string;
  payload: unknown;
  timestamp: number;
}

function openQueueDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not available"));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueAction(
  type: string,
  endpoint: string,
  method: string,
  payload: unknown,
): Promise<void> {
  try {
    const db = await openQueueDB();
    const action: QueuedAction = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      endpoint,
      method,
      payload,
      timestamp: Date.now(),
    };
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(action);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore queue failure
  }
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  try {
    const db = await openQueueDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as QueuedAction[]) || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function removeQueuedAction(id: string): Promise<void> {
  try {
    const db = await openQueueDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore delete failure
  }
}

export async function flushOfflineQueue(): Promise<number> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return 0;

  const actions = await getQueuedActions();
  if (!actions.length) return 0;

  let syncedCount = 0;
  for (const action of actions) {
    try {
      const res = await fetch(action.endpoint, {
        method: action.method,
        headers: { "Content-Type": "application/json" },
        body: action.payload ? JSON.stringify(action.payload) : undefined,
      });

      if (res.ok) {
        await removeQueuedAction(action.id);
        syncedCount++;
      }
    } catch {
      // Break on first network error to maintain order
      break;
    }
  }

  return syncedCount;
}
