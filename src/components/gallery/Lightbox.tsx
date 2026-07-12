'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getClientToken } from '@/lib/auth'
import type { ScreenshotData } from '@/lib/types'

interface Props {
  screenshots: ScreenshotData[]
  index: number
  worlds: { id: string; name: string; slug: string }[]
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onMutated: () => void
}

export default function Lightbox({ screenshots, index, worlds, onClose, onPrev, onNext, onMutated }: Props) {
  const s = screenshots[index]
  if (!s) return null

  return (
    <LightboxInner
      key={s.id + index}
      screenshot={s}
      worlds={worlds}
      hasPrev={index > 0}
      hasNext={index < screenshots.length - 1}
      onClose={onClose}
      onPrev={onPrev}
      onNext={onNext}
      onMutated={onMutated}
    />
  )
}

function LightboxInner({
  screenshot,
  worlds,
  hasPrev,
  hasNext,
  onClose,
  onPrev,
  onNext,
  onMutated,
}: {
  screenshot: ScreenshotData
  worlds: { id: string; name: string; slug: string }[]
  hasPrev: boolean
  hasNext: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onMutated: () => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const displayRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 })
  const [animating, setAnimating] = useState(false)
  const animRef = useRef<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editWorldId, setEditWorldId] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const authed = !!getClientToken()

  const imgSrc = `/api/screenshots/${screenshot.id}/download`

  const resetView = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    setAnimating(false)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    resetView()
  }, [screenshot.id, resetView])

  useEffect(() => {
    if (!displayRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setViewport({ w: e.contentRect.width, h: e.contentRect.height })
      }
    })
    ro.observe(displayRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onPrev()
      if (e.key === 'ArrowRight' && hasNext) onNext()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, onPrev, onNext, hasPrev, hasNext])

  function animateTo(targetZoom: number, targetPanX: number, targetPanY: number) {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const from = { zoom, x: pan.x, y: pan.y }
    const start = performance.now()
    const dur = 220

    function tick(ts: number) {
      const t = Math.min(1, (ts - start) / dur)
      const ease = 1 - Math.pow(1 - t, 3)
      const z = from.zoom + (targetZoom - from.zoom) * ease
      setZoom(z)
      setPan({
        x: from.x + (targetPanX - from.x) * ease,
        y: from.y + (targetPanY - from.y) * ease,
      })
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        setZoom(targetZoom)
        setPan({ x: targetPanX, y: targetPanY })
        setAnimating(false)
        animRef.current = null
      }
    }
    setAnimating(true)
    animRef.current = requestAnimationFrame(tick)
  }

  function handleWheel(e: React.WheelEvent) {
    if (!imgRef.current || !wrapRef.current) return
    e.preventDefault()
    const rect = imgRef.current.getBoundingClientRect()
    const wrapRect = wrapRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left - rect.width / 2
    const my = e.clientY - rect.top - rect.height / 2
    const oldZ = zoom
    const newZ = Math.max(1, Math.min(8, oldZ + (e.deltaY > 0 ? -0.4 : 0.4)))
    const roundedZ = Math.round(newZ * 10) / 10
    if (roundedZ === oldZ) return
    const newPanX = pan.x + mx - (roundedZ / oldZ) * mx
    const newPanY = pan.y + my - (roundedZ / oldZ) * my
    animateTo(roundedZ, newPanX, newPanY)
  }

  function handleDoubleClick(e: React.MouseEvent) {
    if (!imgRef.current || !wrapRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const wrapRect = wrapRef.current.getBoundingClientRect()
    if (zoom > 1) {
      resetView()
    } else {
      const mx = e.clientX - rect.left - rect.width / 2
      const my = e.clientY - rect.top - rect.height / 2
      const targetZoom = 2.5
      const newPanX = -(mx - mx / targetZoom)
      const newPanY = -(my - my / targetZoom)
      animateTo(targetZoom, newPanX, newPanY)
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (zoom <= 1 || e.button !== 0) return
    e.preventDefault()
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
      setAnimating(false)
    }
    setDragging(true)
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
  }

  useEffect(() => {
    if (!dragging) return
    function onMove(e: MouseEvent) {
      setPan({
        x: dragRef.current.panX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.panY + (e.clientY - dragRef.current.startY),
      })
    }
    function onUp() {
      setDragging(false)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  const isZoomed = zoom > 1

  async function saveMetadata() {
    const token = getClientToken()
    if (!token) return
    setSaving(true)
    try {
      const tags = editTags.split(',').map(t => t.trim()).filter(Boolean)
      await fetch(`/api/screenshots/${screenshot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editTitle || null, description: editDesc || null, tags, worldId: editWorldId || null }),
      })
      setEditing(false)
      onMutated()
    } catch { } finally { setSaving(false) }
  }

  async function deleteScreenshot() {
    const token = getClientToken()
    if (!token) return
    try {
      await fetch(`/api/screenshots/${screenshot.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      onClose()
      onMutated()
    } catch { }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 opacity-0 animate-[fadeIn_0.25s_ease_forwards]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative flex max-w-[95vw] max-h-[92vh] bg-[#141414] rounded-xl overflow-hidden shadow-2xl scale-95 opacity-0 animate-[scaleIn_0.25s_ease_0.1s_forwards]">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-md bg-black/50 text-[#aaa] hover:bg-black/80 hover:text-white transition-colors text-lg"
        >
          ✕
        </button>

        {/* Prev / Next */}
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-lg bg-black/50 text-white/50 hover:bg-black/80 hover:text-white transition-colors text-2xl"
          >
            ‹
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-lg bg-black/50 text-white/50 hover:bg-black/80 hover:text-white transition-colors text-2xl"
          >
            ›
          </button>
        )}

        {/* Image */}
        <div
          ref={wrapRef}
          className="flex-1 min-w-0 flex items-center justify-center overflow-hidden bg-[#0d0d0d] relative"
        >
          <div ref={displayRef} className="relative inline-flex">
            <img
              ref={imgRef}
              src={imgSrc}
              alt={screenshot.title || screenshot.filename}
              draggable={false}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onDoubleClick={handleDoubleClick}
              style={{
                maxWidth: '75vw',
                maxHeight: '92vh',
                display: 'block',
                cursor: isZoomed ? (dragging ? 'grabbing' : 'grab') : 'zoom-in',
                userSelect: 'none',
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            />
          </div>
          {/* Zoom badge */}
          {animating || isZoomed ? (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-black/70 text-xs text-[#ccc] pointer-events-none transition-opacity duration-200">
              {Math.round(zoom * 100)}%
            </div>
          ) : null}
          {/* Minimap */}
          {isZoomed && viewport.w > 0 && screenshot.width && screenshot.height && (
            <div className="absolute bottom-4 right-4 w-28 h-[4.5rem] rounded-md overflow-hidden border border-white/20 bg-black/70 shadow-lg pointer-events-none">
              <img src={imgSrc} className="w-full h-full object-contain opacity-40" alt="" />
              <div
                className="absolute border border-white/70 bg-white/5"
                style={{
                  width: `${Math.round(Math.min(100, viewport.w / (screenshot.width * zoom) * 100))}%`,
                  height: `${Math.round(Math.min(100, viewport.h / (screenshot.height * zoom) * 100))}%`,
                  left: `${Math.round(Math.max(0, 50 - viewport.w / (screenshot.width * zoom) * 50 - pan.x / screenshot.width * 100))}%`,
                  top: `${Math.round(Math.max(0, 50 - viewport.h / (screenshot.height * zoom) * 50 - pan.y / screenshot.height * 100))}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 border-l border-[var(--color-border)] p-7 flex flex-col gap-5 overflow-y-auto bg-[#141414]">
          {editing ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Title</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">World</label>
                <select value={editWorldId} onChange={e => setEditWorldId(e.target.value)} className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]">
                  <option value="">—</option>
                  {worlds.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Tags (comma-separated)</label>
                <input value={editTags} onChange={e => setEditTags(e.target.value)} className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]" placeholder="#builds, #base" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Description</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-xs text-[var(--color-text-dim)] outline-none resize-none focus:border-[var(--color-accent)]" />
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={saveMetadata} disabled={saving} className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-black font-medium hover:bg-[var(--color-accent-dim)] disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Title</label>
                <div className="font-[family-name:var(--font-sans)] text-lg font-medium tracking-tight text-[var(--color-text)]">
                  {screenshot.title || 'Untitled'}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Date</label>
                <div className="text-sm text-[var(--color-text)]">
                  {screenshot.date ? new Date(screenshot.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">World</label>
                <div className="text-sm text-[var(--color-text)]">{screenshot.world?.name || '—'}</div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {screenshot.tags?.length ? screenshot.tags.map(t => (
                    <span key={t.id} className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-hover)] text-[var(--color-accent)]">{t.name}</span>
                  )) : <span className="text-sm text-[var(--color-text-dim)]">—</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Description</label>
                <div className="text-xs text-[var(--color-text-dim)] leading-relaxed">{screenshot.description || '—'}</div>
              </div>
              {authed && (
                <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
                  <button onClick={() => { setEditTitle(screenshot.title || ''); setEditDesc(screenshot.description || ''); setEditTags(screenshot.tags?.map(t => t.name).join(', ') || ''); setEditWorldId(screenshot.worldId || ''); setEditing(true) }} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors">
                    Edit
                  </button>
                  <button onClick={() => setShowDelete(true)} className="text-xs px-3 py-1.5 rounded-lg border border-red-800 text-red-400 hover:bg-red-900/30 transition-colors">
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
          {showDelete && (
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800/50">
              <p className="text-xs text-red-400">Delete this screenshot? This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={deleteScreenshot} className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-red-700 text-white hover:bg-red-600 transition-colors">Delete</button>
                <button onClick={() => setShowDelete(false)} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
