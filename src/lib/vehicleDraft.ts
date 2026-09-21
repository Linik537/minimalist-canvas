export type DraftPhoto = { id: string; file: File }
import type { PhotoCrop } from './photoCrop'
type VehicleDraft<T> = { values: T; createdId?: string; order?: string[]; crops?: Record<string, PhotoCrop> }

const databaseName = 'braza-admin-drafts'
const storeName = 'vehicle-photos'

export function readVehicleDraft<T>(key: string): VehicleDraft<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const draft: unknown = JSON.parse(raw)
    if (typeof draft !== 'object' || draft === null || !('values' in draft)) return null
    return draft as VehicleDraft<T>
  } catch {
    return null
  }
}

export function writeVehicleDraft<T>(key: string, values: T, createdId?: string, order?: string[], crops?: Record<string, PhotoCrop>) {
  try { localStorage.setItem(key, JSON.stringify({ values, createdId, order, crops })) } catch { /* armazenamento indisponível */ }
}

export function clearVehicleDraft(key: string) {
  try { localStorage.removeItem(key) } catch { /* armazenamento indisponível */ }
}

function openDraftDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(storeName)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadDraftPhotos(key: string): Promise<DraftPhoto[]> {
  const database = await openDraftDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).get(key)
    request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result.filter((photo: DraftPhoto) => typeof photo?.id === 'string' && photo.file instanceof File) : [])
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => database.close()
    transaction.onabort = () => { database.close(); reject(transaction.error) }
  })
}

export async function saveDraftPhotos(key: string, photos: DraftPhoto[]): Promise<void> {
  const database = await openDraftDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).put(photos, key)
    transaction.oncomplete = () => { database.close(); resolve() }
    transaction.onerror = () => { database.close(); reject(transaction.error) }
  })
}

export async function clearDraftPhotos(key: string): Promise<void> {
  const database = await openDraftDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).delete(key)
    transaction.oncomplete = () => { database.close(); resolve() }
    transaction.onerror = () => { database.close(); reject(transaction.error) }
  })
}
