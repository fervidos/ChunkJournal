'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { ScreenshotData } from '@/lib/types'
import PanoramaViewer from './PanoramaViewer'

interface Props {
  screenshots: ScreenshotData[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function Lightbox({ screenshots, index, onClose, onPrev, onNext }: Props) {
  const s = screenshots[index]
  if (!s) return null

  // Preload adjacent images for smooth navigation
  useEffect(() => {
    const preload = (i: number) => {
      if (i >= 0 && i < screenshots.length) {
        const thumb = new Image()
        thumb.src = `/api/screenshots/${screenshots[i].id}/download?thumb=1`
        const full = new Image()
        full.src = `/api/screenshots/${screenshots[i].id}/download`
      }
    }
    preload(index - 1)
    preload(index + 2)
    preload(index - 2)
    preload(index + 1)
  }, [index, screenshots])

  return (
    <LightboxInner
      screenshot={s}
      hasPrev={index > 0}
      hasNext={index < screenshots.length - 1}
      onClose={onClose}
      onPrev={onPrev}
      onNext={onNext}
    />
  )
}

function LightboxInner({
  screenshot,
  hasPrev,
  hasNext,
  onClose,
  onPrev,
  onNext,
}: {
  screenshot: ScreenshotData
  hasPrev: boolean
  hasNext: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 })
  const [animating, setAnimating] = useState(false)
  const animRef = useRef<number | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [viewport, setViewport] = useState({ w: 0, h: 0 })

  const imgSrc = `/api/screenshots/${screenshot.id}/download`

  // Reset loaded state on navigation so old image doesn't linger
  useEffect(() => {
    setImageLoaded(false)
  }, [screenshot.id])

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
    if (!wrapRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setViewport({ w: e.contentRect.width, h: e.contentRect.height })
      }
    })
    ro.observe(wrapRef.current)
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

  return (
    <div
      className="fixed inset-0 z-50 bg-black opacity-0 animate-[fadeIn_0.25s_ease_forwards]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:bg-white/10 hover:text-white transition-colors text-xl"
      >
        ✕
      </button>

      {/* Prev / Next */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 text-white/50 hover:bg-white/10 hover:text-white transition-colors text-3xl"
        >
          ‹
        </button>
      )}
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 text-white/50 hover:bg-white/10 hover:text-white transition-colors text-3xl"
        >
          ›
        </button>
      )}

      {/* Image / Panorama */}
      {screenshot.panorama ? (
        <PanoramaViewer imageUrl={imgSrc} />
      ) : (
        <div ref={wrapRef} className="w-full h-full flex items-center justify-center">
          {!imageLoaded && (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            key={screenshot.id}
            ref={imgRef}
            src={imgSrc}
            alt={screenshot.title || screenshot.filename}
            draggable={false}
            onLoad={() => setImageLoaded(true)}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            style={{
              maxWidth: '100vw',
              maxHeight: '100vh',
              display: 'block',
              cursor: isZoomed ? (dragging ? 'grabbing' : 'grab') : 'zoom-in',
              userSelect: 'none',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.2s',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          />
          {/* Zoom badge */}
          {(animating || isZoomed) && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-black/70 text-xs text-[#ccc] pointer-events-none z-30">
              {Math.round(zoom * 100)}%
            </div>
          )}
          {/* Minimap */}
          {isZoomed && viewport.w > 0 && screenshot.width && screenshot.height && (
            <div className="fixed bottom-6 right-6 w-28 h-[4.5rem] rounded-md overflow-hidden border border-white/20 bg-black/70 shadow-lg pointer-events-none z-30">
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
      )}
    </div>
  )
}
