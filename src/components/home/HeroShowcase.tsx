'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { ScreenshotData } from '@/lib/types'

interface Props {
  initialScreenshots: ScreenshotData[]
  totalScreenshots: number
  totalWorlds: number
  totalTags: number
}

export default function HeroShowcase({ initialScreenshots, totalScreenshots, totalWorlds, totalTags }: Props) {
  const [screenshots] = useState<ScreenshotData[]>(() => {
    const a = [...initialScreenshots]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  })

  const [current, setCurrent] = useState(0)
  const [fadingTo, setFadingTo] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [ready, setReady] = useState<Set<number>>(new Set())

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const preloadRef = useRef<number | null>(null)

  const n = screenshots.length

  // Warm up the first few images on mount
  useEffect(() => {
    screenshots.slice(0, 5).forEach((s, i) => {
      const img = new Image()
      img.onload = () => setReady(prev => new Set(prev).add(i))
      img.onerror = () => setReady(prev => new Set(prev).add(i))
      img.src = `/api/screenshots/${s.id}/download`
    })
  }, [screenshots])

  // Preload one image ahead of current
  useEffect(() => {
    if (n <= 1) return
    const nextIdx = (current + 1) % n
    if (ready.has(nextIdx)) return
    const img = new Image()
    preloadRef.current = nextIdx
    img.onload = () => {
      setReady(prev => new Set(prev).add(nextIdx))
    }
    img.onerror = () => {
      setReady(prev => new Set(prev).add(nextIdx))
    }
    img.src = `/api/screenshots/${screenshots[nextIdx].id}/download`
  }, [current, n, ready, screenshots])

  // Auto-advance timer
  useEffect(() => {
    if (n <= 1 || paused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      advance((current + 1) % n)
    }, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [current, n, paused])

  function advance(idx: number) {
    if (idx === current || fadingTo !== null) return
    setFadingTo(idx)
    setTimeout(() => {
      setCurrent(idx)
      setFadingTo(null)
    }, 600)
  }

  function goTo(idx: number) {
    if (idx === current || fadingTo !== null) return
    advance(idx)
    setPaused(true)
    setTimeout(() => setPaused(false), 10000)
  }

  function go(dir: 1 | -1) {
    goTo((current + dir + n) % n)
  }

  const s = screenshots[current]
  const nextS = fadingTo !== null ? screenshots[fadingTo] : null
  const transitioning = fadingTo !== null
  const loaded = ready.has(current)

  if (n === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 mb-6">
            <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--color-text-dim)] mb-3">This story is waiting to be written</h3>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-8">Every great journey starts with a single block. Upload your first screenshot and begin your archive.</p>
          <Link href="/gallery" className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-black font-medium hover:bg-[var(--color-accent-dim)] transition-all duration-200 hover:scale-105">
            Begin your archive
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-16 py-8 sm:py-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false) }}
    >
      {/* Tagline */}
      <div className="text-center mb-10 lg:mb-14 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 text-[0.625rem] uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-5">
          <span className="w-6 h-px bg-[var(--color-border)]" />
          Chunk by Chunk
          <span className="w-6 h-px bg-[var(--color-border)]" />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
          <span className="text-[var(--color-accent)]">Chunk</span><span className="text-white">Journal</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-[var(--color-text-dim)] leading-relaxed max-w-md mx-auto">
          A collection of the worlds I&apos;ve explored, the places I&apos;ve built, and the memories I&apos;ve made with the people I&apos;ve met along the way. Every screenshot tells a story I don&apos;t want to forget, and this is where I&apos;ve chosen to keep them.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link href="/gallery" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-black font-semibold hover:bg-[var(--color-accent-dim)] transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-[var(--color-accent)]/20">
            Enter the Gallery
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-all duration-200">
            Login
          </Link>
        </div>
      </div>

      {/* Showcase */}
      <div className="relative w-full max-w-5xl aspect-[16/9] rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-2xl shadow-black/50 bg-[var(--color-bg-card)]">
        {/* Shimmer placeholder behind everything */}
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-[var(--color-bg-hover)]" />
        )}

        {/* Incoming image */}
        {nextS && (
          <img
            key={`in-${fadingTo}`}
            src={`/api/screenshots/${nextS.id}/download`}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-600 ${transitioning ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        {/* Current image */}
        <img
          key={`cur-${current}`}
          src={`/api/screenshots/${s.id}/download`}
          alt={s.title || s.filename}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-600 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Metadata */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
          <div className="max-w-2xl">
            <div className={`transition-all duration-500 ${transitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">{s.title || s.filename}</h2>
              {s.description && <p className="mt-2 text-sm sm:text-base text-white/60 line-clamp-2 max-w-lg leading-relaxed">{s.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {s.world && <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 backdrop-blur-sm border border-white/10">{s.world.name}</span>}
                {s.tags?.slice(0, 3).map(t => (
                  <span key={t.id} className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] backdrop-blur-sm border border-[var(--color-accent)]/20">#{t.name}</span>
                ))}
                {s.tags && s.tags.length > 3 && <span className="text-xs text-white/40">+{s.tags.length - 3}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        {n > 1 && (
          <>
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <button onClick={() => go(-1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 text-white/60 hover:bg-black/60 hover:text-white transition-colors backdrop-blur-sm" aria-label="Previous">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
              </button>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm">
                {screenshots.slice(0, 7).map((_, i) => (
                  <button key={i} onClick={() => goTo(i)} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-4' : 'bg-white/20 hover:bg-white/40'}`} aria-label={`Go to ${i + 1}`} />
                ))}
                {n > 7 && <span className="text-[0.625rem] text-white/30 ml-0.5">+{n - 7}</span>}
              </div>
              <button onClick={() => go(1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 text-white/60 hover:bg-black/60 hover:text-white transition-colors backdrop-blur-sm" aria-label="Next">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
              </button>
            </div>
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-[0.625rem] text-white/50">{current + 1} / {n}</div>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="mt-10 flex items-center gap-8 sm:gap-12">
        <div className="text-center">
          <div className="text-xl font-bold text-white">{totalScreenshots}</div>
          <div className="text-[0.625rem] text-[var(--color-text-muted)] uppercase tracking-[0.15em] mt-0.5">Screenshots</div>
        </div>
        <div className="w-px h-10 bg-[var(--color-border)]" />
        <div className="text-center">
          <div className="text-xl font-bold text-white">{totalWorlds}</div>
          <div className="text-[0.625rem] text-[var(--color-text-muted)] uppercase tracking-[0.15em] mt-0.5">Worlds</div>
        </div>
        <div className="w-px h-10 bg-[var(--color-border)]" />
        <div className="text-center">
          <div className="text-xl font-bold text-white">{totalTags}</div>
          <div className="text-[0.625rem] text-[var(--color-text-muted)] uppercase tracking-[0.15em] mt-0.5">Tags</div>
        </div>
      </div>
    </div>
  )
}
