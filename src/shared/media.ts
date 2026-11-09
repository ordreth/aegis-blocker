/** Block-page media lives in IndexedDB so large files never touch chrome.storage quotas. */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];

const DB = "aegis-media";
const STORE = "files";

const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).finally(() => db.close());
}

export const validateMedia = (file: File): "image" | "video" | null => {
  if (IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_BYTES) return "image";
  if (VIDEO_TYPES.includes(file.type) && file.size <= MAX_VIDEO_BYTES) return "video";
  return null;
};

export const putMedia = (id: string, blob: Blob) => tx("readwrite", (s) => s.put(blob, id));
export const deleteMedia = (id: string) => tx("readwrite", (s) => s.delete(id));
export const getMedia = (id: string) =>
  tx<Blob | undefined>("readonly", (s) => s.get(id) as IDBRequest<Blob | undefined>);
