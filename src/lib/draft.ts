'use client'

const DRAFT_KEY = 'cj_upload_draft'
const DB_NAME = 'ChunkJournalDraft'
const STORE_NAME = 'blobs'

interface DraftFileMeta {
  storageId: string
  name: string
  size: number
  type: string
  lastModified: number
  title: string
  description: string
  tags: string
  worldId: string
  date: string
}

interface DraftData {
  files: DraftFileMeta[]
  savedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function storeBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(blob, key)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

async function loadBlob(key: string): Promise<Blob | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => { db.close(); resolve(req.result ?? undefined) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

async function removeBlobs(keys: string[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    for (const key of keys) store.delete(key)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

async function clearAllBlobs(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export interface StorableFileEntry {
  id: number
  file: { name: string; size: number; type: string; lastModified: number }
  preview: string
  title: string
  description: string
  tags: string
  worldId: string
  date: string
  storageId: string
}

export async function saveDraft(entries: StorableFileEntry[]): Promise<void> {
  const meta: DraftFileMeta[] = entries.map(e => ({
    storageId: e.storageId,
    name: e.file.name,
    size: e.file.size,
    type: e.file.type,
    lastModified: e.file.lastModified,
    title: e.title,
    description: e.description,
    tags: e.tags,
    worldId: e.worldId,
    date: e.date,
  }))
  const data: DraftData = { files: meta, savedAt: Date.now() }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
}

export async function loadDraft(): Promise<StorableFileEntry[] | null> {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  const data: DraftData = JSON.parse(raw)
  if (!data.files.length) return null

  const entries: StorableFileEntry[] = []
  for (let index = 0; index < data.files.length; index++) {
    const meta = data.files[index]
    const blob = await loadBlob(meta.storageId)
    if (!blob) continue
    entries.push({
      id: (parseInt(meta.storageId.slice(0, 8), 16) || 0) + index,
      file: new File([blob], meta.name, { type: meta.type, lastModified: meta.lastModified }),
      preview: URL.createObjectURL(blob),
      title: meta.title,
      description: meta.description,
      tags: meta.tags,
      worldId: meta.worldId,
      date: meta.date,
      storageId: meta.storageId,
    })
  }
  return entries.length > 0 ? entries : null
}

export async function clearDraft(): Promise<void> {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (raw) {
    try {
      const data: DraftData = JSON.parse(raw)
      await removeBlobs(data.files.map(f => f.storageId))
    } catch {}
  }
  localStorage.removeItem(DRAFT_KEY)
}

export function hasDraft(): boolean {
  return localStorage.getItem(DRAFT_KEY) !== null
}
