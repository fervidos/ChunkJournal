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
  const n = screenshots.length
  const imgSrc = (id: string) => `/api/screenshots/${id}/download?width=1600`

  useEffect(() => {
    screenshots.slice(0, 5).forEach((s, i) => {
      const img = new Image()
      img.onload = () => setReady(prev => new Set(prev).add(i))
      img.onerror = () => setReady(prev => new Set(prev).add(i))
      img.src = imgSrc(s.id)
    })
  }, [screenshots])

  useEffect(() => {
    if (n <= 1) return
    const nextIdx = (current + 1) % n
    if (ready.has(nextIdx)) return
    const img = new Image()
    img.onload = () => setReady(prev => new Set(prev).add(nextIdx))
    img.onerror = () => setReady(prev => new Set(prev).add(nextIdx))
    img.src = imgSrc(screenshots[nextIdx].id)
  }, [current, n, ready, screenshots])

  useEffect(() => {
    if (n <= 1 || paused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => advance((current + 1) % n), 6000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [current, n, paused])

  function advance(idx: number) {
    if (idx === current || fadingTo !== null) return
    setFadingTo(idx)
    setTimeout(() => { setCurrent(idx); setFadingTo(null) }, 450)
  }
  function goTo(idx: number) {
    if (idx === current || fadingTo !== null) return
    advance(idx)
    setPaused(true)
    setTimeout(() => setPaused(false), 8000)
  }
  function go(dir: 1 | -1) { goTo((current + dir + n) % n) }

  const s = screenshots[current]
  const nextS = fadingTo !== null ? screenshots[fadingTo] : null
  const transitioning = fadingTo !== null

  if (n === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-[480px] w-full bg-[#e8e0d0] border border-[#d4c9b8] p-8 shadow-[0_12px_30px_rgba(0,0,0,0.25)] rotate-[-0.3deg] relative">
          <div className="absolute -top-3 left-8 w-20 h-5 bg-[#f0deb8]/90 border border-black/5 shadow-sm rotate-[-2deg]" />
          <div className="font-mono text-[11px] tracking-[0.16em] text-[#8d847a] mb-3">ARCHIVE — EMPTY SHEET</div>
          <h3 className="font-serif text-[24px] font-bold tracking-tight text-[#1a1816] leading-none">This story is waiting<br />to be written.</h3>
          <p className="mt-3 text-[14px] leading-relaxed text-[#5a5348]">Every great journey starts with a single block.</p>
          <Link href="/gallery" className="mt-6 inline-flex text-[12px] font-mono tracking-widest px-4 py-2 bg-[#1a1816] text-[#e8e0d0] hover:bg-black transition-colors">BEGIN ARCHIVE →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative flex flex-col">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="grid lg:grid-cols-[0.95fr_1.35fr] gap-10 lg:gap-16 xl:gap-20 items-start">

          {/* LEFT — editorial, now with air */}
          <div className="flex flex-col">
            <div className="font-mono text-[11px] tracking-[0.16em] text-white/40">
              ARCHIVE V.01 — <span className="text-[#a9b998]">{n} FRAMES</span> — FIELD NOTES
            </div>

            <h1 className="mt-4 font-serif font-black tracking-[-0.04em] leading-[0.84] text-[46px] sm:text-[56px] lg:text-[64px]">
              <span className="block text-[#a9b998]">Chunk</span>
              <span className="block text-[#f2ede6] -mt-1">Journal</span>
            </h1>

            <div className="mt-4 max-w-[280px]">
              <svg viewBox="0 0 280 8" className="w-full h-2 text-[#a9b998]/70" fill="none" preserveAspectRatio="none">
                <path d="M2 5 C 60 1, 140 7, 278 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <div className="flex justify-between font-mono text-[10px] tracking-[0.18em] text-white/25 mt-1">
                <span>EST. 2026</span><span>CHUNK BY CHUNK</span>
              </div>
            </div>

            <p className="mt-8 text-[15px] leading-[1.7] text-[#d4c9b8] max-w-[38ch]">
              Worlds explored, places built, people met. Every screenshot tells a story — this is where I choose to keep them.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/gallery"
                className="inline-flex items-center gap-3 px-5 py-3 bg-[#e8e0d0] text-[#1a1816] font-mono text-[12px] tracking-[0.12em] font-bold border border-[#d4c9b8] shadow-[3px_3px_0_rgba(0,0,0,0.22)] hover:shadow-[2px_2px_0_rgba(0,0,0,0.22)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                ENTER GALLERY <span className="w-5 h-5 border border-[#1a1816] grid place-items-center text-[11px]">→</span>
              </Link>
              <Link href="/login" className="px-4 py-3 font-mono text-[12px] tracking-[0.12em] text-white/55 border border-white/12 hover:text-white hover:border-white/25 transition-colors">
                CURATOR LOGIN
              </Link>
            </div>

            {/* Single ledger line — not 3 cards */}
            <div className="mt-10 pt-4 border-t border-white/10 max-w-[38ch]">
              <div className="font-mono text-[11px] tracking-[0.14em] text-white/35 flex flex-wrap gap-x-3 gap-y-1">
                <span className="text-[#f2ede6] font-bold">{totalScreenshots} frames</span>
                <span className="text-white/15">•</span>
                <span>{totalWorlds} worlds</span>
                <span className="text-white/15">•</span>
                <span>{totalTags} tags</span>
                <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 pl-3 border-l border-white/10">
                  <span className="w-1.5 h-1.5 bg-[#a9b998] rotate-45" />
                  <span className="tracking-[0.12em]">CATALOGUED</span>
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT — single pinned print, de-crowded */}
          <div className="relative lg:mt-1">
            <div className="hidden lg:block absolute -top-2 left-1/2 -translate-x-1/2 z-20">
              <div className="w-3.5 h-3.5 rounded-full bg-[#c45a3a] border-[1.5px] border-[#9a3a1e] shadow-[0_2px_5px_rgba(0,0,0,0.35)] relative">
                <div className="absolute inset-[3px] rounded-full bg-white/20" />
                <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-[1.5px] h-[6px] bg-[#5a5348]" />
              </div>
            </div>

            <div className="relative bg-[#e8e0d0] p-[9px] sm:p-[10px] shadow-[0_16px_40px_rgba(0,0,0,0.4)] border border-[#d4c9b8]/60 rotate-[0.5deg]">
              {/* ONE tape only — intentional imperfection */}
              <div className="absolute -top-3 left-6 sm:left-8 w-[88px] h-[22px] bg-[#f0deb8] border border-black/[0.07] shadow-[0_1px_3px_rgba(0,0,0,0.14)] rotate-[-2deg] z-10">
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 4px, black 4px, transparent 5px)` }} />
              </div>

              <div className="relative bg-[#0f0e0d] border border-[#1a1816] overflow-hidden">
                <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-[#0f0e0d]">
                  {nextS && (
                    <img key={`n-${fadingTo}`} src={imgSrc(nextS.id)} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-450 ${transitioning ? 'opacity-100' : 'opacity-0'}`} draggable={false} />
                  )}
                  <img key={`c-${current}`} src={imgSrc(s.id)} alt={s.title || s.filename} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-450 ${transitioning ? 'opacity-0' : 'opacity-100'}`} draggable={false} />
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.2)]" />
                </div>

                {/* Caption — paper, minimal: title + 2 tags + one action */}
                <div className="bg-[#e8e0d0] border-t-[1.5px] border-[#1a1816] px-3 sm:px-4 py-3 flex items-end gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {s.world && <span className="font-mono text-[10px] tracking-widest font-bold px-2 py-1 bg-[#1a1816] text-[#e8e0d0]">● {s.world.name.toUpperCase()}</span>}
                      <span className="font-mono text-[10px] tracking-wide text-[#8d847a] hidden sm:inline">{String(current + 1).padStart(2, '0')}/{String(n).padStart(2, '0')} • {s.panorama ? 'PANORAMA' : 'SHOT'}</span>
                    </div>
                    <h2 className={`font-serif text-[18px] font-bold leading-none tracking-[-0.02em] text-[#1a1816] truncate transition-all duration-300 ${transitioning ? 'opacity-0 translate-y-1' : 'opacity-100'}`}>{s.title || s.filename}</h2>
                    <div className="mt-1.5 flex gap-1.5 flex-wrap">
                      {s.tags?.slice(0, 2).map(t => (
                        <span key={t.id} className="font-hand text-[13px] leading-none text-[#5a5348] bg-white/55 border border-black/10 px-2 py-1">#{t.name}</span>
                      ))}
                      {s.tags && s.tags.length > 2 && <span className="font-mono text-[10px] text-[#8d847a] self-center">+{s.tags.length - 2}</span>}
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col gap-2 shrink-0">
                    <Link href={`/gallery?world=${s.world?.slug ?? ''}`} className="font-mono text-[11px] tracking-widest font-bold px-3 py-2 bg-[#1a1816] text-[#e8e0d0] hover:bg-black border border-[#1a1816] text-center">VIEW ↗</Link>
                    <div className="flex gap-1">
                      <button onClick={() => go(-1)} className="w-7 h-7 grid place-items-center border border-black/15 bg-white/50 hover:bg-[#1a1816] hover:text-[#e8e0d0] transition-colors" aria-label="Prev">‹</button>
                      <button onClick={() => go(1)} className="w-7 h-7 grid place-items-center border border-[#1a1816] bg-[#1a1816] text-[#e8e0d0] hover:bg-black transition-colors" aria-label="Next">›</button>
                    </div>
                  </div>
                  <Link href={`/gallery?world=${s.world?.slug ?? ''}`} className="sm:hidden w-8 h-8 bg-[#1a1816] text-[#e8e0d0] grid place-items-center shrink-0">→</Link>
                </div>
              </div>

              {/* Single thin meta line — not a second footer */}
              <div className="flex justify-between items-center pt-2 px-1 font-mono text-[10px] tracking-[0.13em] text-[#5a5348]/80">
                <span>SHEET 01 — ARCHIVE PREVIEW</span>
                <button onClick={() => setPaused(p => !p)} className="hover:text-[#1a1816] transition-colors">{paused ? 'PAUSED' : 'AUTO • 6s'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 h-px w-full bg-[#25211e]" />
    </div>
  )
}
