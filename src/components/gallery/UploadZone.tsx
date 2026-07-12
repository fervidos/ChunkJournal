'use client'

import { useRef, useState } from 'react'
import { getClientToken } from '@/lib/auth'
import exifr from 'exifr'

interface FileEntry {
  id: number
  file: File
  preview: string
  title: string
  description: string
  tags: string
  worldId: string
  date: string
}

interface Props {
  onClose: () => void
  onUploaded: () => void
  worlds: { id: string; name: string; slug: string }[]
}

export default function UploadZone({ onClose, onUploaded, worlds }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState<FileEntry[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const idCounter = useRef(0)

  async function addFiles(list: FileList | File[]) {
    const newEntries: FileEntry[] = []
    for (const file of Array.from(list)) {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image`)
        continue
      }
      let date: string
      try {
        const exif = await exifr.parse(file, ['DateTimeOriginal'])
        if (exif?.DateTimeOriginal) {
          date = new Date(exif.DateTimeOriginal).toISOString().slice(0, 16)
        } else {
          date = new Date(file.lastModified).toISOString().slice(0, 16)
        }
      } catch {
        date = new Date(file.lastModified).toISOString().slice(0, 16)
      }
      newEntries.push({
        id: ++idCounter.current,
        file,
        preview: URL.createObjectURL(file),
        title: file.name.replace(/\.[^.]+$/, ''),
        description: '',
        tags: '',
        worldId: worlds.length === 1 ? worlds[0].id : '',
        date,
      })
    }
    setFiles(prev => [...prev, ...newEntries])
    setError('')
  }

  function removeFile(id: number) {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  function updateFile(id: number, key: keyof FileEntry, value: string) {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f))
  }

  async function uploadAll() {
    const token = getClientToken()
    if (!token) return
    setUploading(true)
    setError('')
    try {
      const CONCURRENCY = 5
      const results: { ok: boolean; name: string; error?: string }[] = []
      for (let i = 0; i < files.length; i += CONCURRENCY) {
        const batch = files.slice(i, i + CONCURRENCY)
        const batchResults = await Promise.all(
          batch.map(async (entry) => {
            const form = new FormData()
            form.set('file', entry.file)
            form.set('title', entry.title)
            form.set('description', entry.description)
            form.set('date', entry.date)
            form.set('tags', JSON.stringify(entry.tags.split(',').map(t => t.trim()).filter(Boolean)))
            if (entry.worldId) form.set('worldId', entry.worldId)
            try {
              const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form,
              })
              if (!res.ok) {
                const err = await res.json()
                return { ok: false, name: entry.file.name, error: err.error?.message || 'Upload failed' }
              }
              return { ok: true, name: entry.file.name }
            } catch {
              return { ok: false, name: entry.file.name, error: 'Upload failed' }
            }
          })
        )
        results.push(...batchResults)
      }
      const failed = results.filter(r => !r.ok)
      if (failed.length > 0) {
        setError(`${failed.length} file(s) failed: ${failed[0].name}${failed[0].error ? ` (${failed[0].error})` : ''}`)
      } else {
        onUploaded()
      }
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1a1a1a] border border-[var(--color-border)] rounded-xl w-full max-w-2xl shadow-2xl scale-95 opacity-0 animate-[scaleIn_0.2s_ease_forwards] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold tracking-tight">
            <span className="text-[var(--color-accent)]">Upload</span> screenshots
          </h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-lg">✕</button>
        </div>

        <div className="p-6 pb-0">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
            className={`border-2 border-dashed rounded-xl py-6 px-8 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
            }`}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <div className="text-[var(--color-text-dim)] text-sm">
              <span className="text-[var(--color-text)] font-medium">Click to browse</span> or drag images here
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {files.map((entry) => (
              <div key={entry.id} className="flex gap-4 p-3 rounded-lg border border-[var(--color-border)] bg-[#161616]">
                <img src={entry.preview} className="w-20 h-20 object-cover rounded flex-shrink-0" />
                <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-2">
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-muted)] truncate">{entry.file.name}</span>
                    <button onClick={() => removeFile(entry.id)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Title</label>
                    <input value={entry.title} onChange={e => updateFile(entry.id, 'title', e.target.value)} className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Date</label>
                    <input type="datetime-local" value={entry.date} onChange={e => updateFile(entry.id, 'date', e.target.value)} className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Tags</label>
                    <input value={entry.tags} onChange={e => updateFile(entry.id, 'tags', e.target.value)} className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]" placeholder="#builds" />
                  </div>
                  <div className="col-span-2 flex flex-col gap-0.5">
                    <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Description</label>
                    <input value={entry.description} onChange={e => updateFile(entry.id, 'description', e.target.value)} className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  {worlds.length > 0 && (
                    <div className="col-span-2 flex flex-col gap-0.5">
                      <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">World</label>
                      <select value={entry.worldId} onChange={e => updateFile(entry.id, 'worldId', e.target.value)} className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]">
                        <option value="">—</option>
                        {worlds.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between p-6 pt-0 border-t border-[var(--color-border)] mt-4">
          {error && <div className="text-xs text-red-400">{error}</div>}
          <div className="flex gap-2 ml-auto">
            {files.length > 0 && (
              <>
                <button onClick={uploadAll} disabled={uploading} className="text-xs px-4 py-1.5 rounded-lg bg-[var(--color-accent)] text-black font-medium hover:bg-[var(--color-accent-dim)] disabled:opacity-50 transition-colors">
                  {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
                </button>
                <button onClick={() => { setFiles([]) }} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors">
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
