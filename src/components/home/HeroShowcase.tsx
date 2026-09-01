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
    timerRef.current = setInterval(() => {
      advance((current + 1) % n)
    }, 5500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [current, n, paused])

  function advance(idx: number) {
    if (idx === current || fadingTo !== null) return
    setFadingTo(idx)
    setTimeout(() => {
      setCurrent(idx)
      setFadingTo(null)
    }, 500)
  }

  function goTo(idx: number) {
    if (idx === current || fadingTo !== null) return
    advance(idx)
    setPaused(true)
    setTimeout(() => setPaused(false), 8000)
  }

  function go(dir: 1 | -1) {
    goTo((current + dir + n) % n)
  }

  const s = screenshots[current]
  const nextS = fadingTo !== null ? screenshots[fadingTo] : null
  const transitioning = fadingTo !== null

  if (n === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-[520px] w-full bg-[#e8e0d0] border border-[#d4c9b8] p-8 shadow-[0_12px_30px_rgba(0,0,0,0.25)] rotate-[-0.3deg] relative">
          <div className="absolute -top-3 left-8 w-20 h-5 bg-[#f0deb8]/90 border border-black/5 shadow-sm rotate-[-2deg]" />
          <div className="absolute -top-2 right-12 w-16 h-5 bg-[#f0deb8]/85 border border-black/5 shadow-sm rotate-[2deg]" />
          <div className="font-mono text-[11px] tracking-[0.16em] text-[#8d847a] mb-3">ARCHIVE — EMPTY SHEET</div>
          <h3 className="font-serif text-[24px] font-bold tracking-tight text-[#1a1816] leading-none">This story is waiting<br />to be written.</h3>
          <p className="mt-3 text-[14px] leading-relaxed text-[#5a5348]">Every great journey starts with a single block. Upload your first screenshot and begin your archive.</p>
          <Link href="/gallery" className="mt-6 inline-flex items-center gap-2 text-[12px] font-mono tracking-widest px-4 py-2 bg-[#1a1816] text-[#e8e0d0] hover:bg-black transition-colors">
            BEGIN ARCHIVE →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative flex flex-col">
      {/* Ruled paper faint lines behind left — notebook feel, not glow */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{
        backgroundImage: `repeating-linear-gradient(transparent, transparent 27px, #d4c9b8 27px, transparent 28px)`,
        backgroundPosition: '0 112px'
      }} />

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex-1 flex flex-col justify-center">
        <div className="grid lg:grid-cols-[1.05fr_1.4fr] gap-8 lg:gap-12 xl:gap-16 items-start">

          {/* LEFT */}
          <div className="flex flex-col pt-1">
            {/* Eyebrow — typewriter, not pill */}
            <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.16em] text-white/45">
              <span className="hidden sm:inline w-6 h-px bg-white/20" />
              <span>ARCHIVE V.01 — <span className="text-[#a9b998]">{n} FRAMES</span> — FIELD NOTES</span>
              <span className="w-6 h-px bg-white/20 hidden sm:inline" />
            </div>

            {/* Title — serif, ink */}
            <h1 className="mt-5 font-serif font-black tracking-[-0.04em] leading-[0.82] text-[48px] sm:text-[56px] lg:text-[64px] xl:text-[72px]">
              <span className="block text-[#a9b998]">Chunk</span>
              <span className="block text-[#f2ede6] -mt-1">Journal</span>
            </h1>

            {/* Hand-drawn underline — svg wobble */}
            <div className="mt-3 max-w-[320px]">
              <svg viewBox="0 0 320 12" className="w-full h-3 text-[#a9b998] opacity-80" fill="none" preserveAspectRatio="none">
                <path d="M2 8 C 40 2, 80 10, 120 6 S 200 3, 260 7 S 310 9, 318 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9" />
                <path d="M2 10 C 60 4, 110 12, 170 8 S 250 6, 318 8" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.35" />
              </svg>
              <div className="flex justify-between items-center mt-1 font-mono text-[10px] tracking-[0.18em] text-white/25">
                <span>EST. 2026</span>
                <span>CHUNK BY CHUNK</span>
              </div>
            </div>

            <p className="mt-6 text-[15px] sm:text-[16px] leading-[1.65] text-[#d4c9b8] max-w-[44ch] font-[450]">
              A collection of the worlds I&apos;ve explored, the places I&apos;ve built, and the people I&apos;ve met along the way.
              <span className="text-[#f2ede6]"> Every screenshot tells a story —</span> this is where I choose to keep them.
            </p>
            <div className="mt-2 font-hand text-[15px] text-[#a9b998] rotate-[-0.8deg] hidden sm:block">
              — catalogued with care, not generated.
            </div>

            {/* CTAs — sharp, ink, not pills */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/gallery"
                className="inline-flex items-center gap-3 px-5 py-3 bg-[#e8e0d0] text-[#1a1816] font-mono text-[12px] tracking-[0.12em] font-bold border border-[#d4c9b8] shadow-[3px_3px_0_rgba(0,0,0,0.25)] hover:shadow-[2px_2px_0_rgba(0,0,0,0.25)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                ENTER GALLERY
                <span className="w-6 h-6 border border-[#1a1816] grid place-items-center text-[12px]">→</span>
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 px-4 py-3 text-[12px] font-mono tracking-[0.12em] text-white/70 border border-white/15 hover:border-white/30 hover:text-white hover:bg-white/[0.04] transition-colors">
                CURATOR LOGIN
              </Link>
            </div>

            {/* Ink stamps — not glass cards */}
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-[420px]">
              {[
                { k: 'SHOTS', v: totalScreenshots, sub: 'FRAMES' },
                { k: 'WORLDS', v: totalWorlds, sub: 'REALMS' },
                { k: 'TAGS', v: totalTags, sub: 'MARKS' },
              ].map((stat) => (
                <div key={stat.k} className="border-[1.5px] border-[#a9b998]/40 bg-[#1a1816] px-3 py-3 relative overflow-hidden">
                  <div className="absolute inset-0 border border-white/[0.04] m-[3px] pointer-events-none" />
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#a9b998] rounded-full opacity-60" />
                  <div className="font-mono text-[9px] tracking-[0.16em] text-white/40">{stat.k} • {stat.sub}</div>
                  <div className="mt-1 font-serif text-[24px] font-black leading-none tracking-[-0.03em] text-[#f2ede6]">{stat.v}</div>
                  <div className="mt-2 h-[2px] w-full bg-white/10">
                    <div className="h-full bg-[#a9b998] w-[68%] opacity-70" />
                  </div>
                  <div className="mt-1.5 font-mono text-[8px] tracking-[0.14em] text-white/25">INK STAMP 01</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3 font-mono text-[10px] tracking-wide text-white/25">
              <span className="w-8 h-px bg-white/15" />
              <span>catalogued & tagged — newest first</span>
            </div>
          </div>

          {/* RIGHT — pinned print */}
          <div className="relative lg:mt-2">
            {/* Push pin */}
            <div className="hidden lg:block absolute -top-3 left-1/2 -translate-x-1/2 z-20">
              <div className="w-4 h-4 rounded-full bg-[#c45a3a] border-2 border-[#9a3a1e] shadow-[0_2px_6px_rgba(0,0,0,0.4)] relative">
                <div className="absolute inset-1 rounded-full bg-white/25" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[2px] h-3 bg-[#5a5348]" />
              </div>
            </div>

            <div className="relative bg-[#e8e0d0] p-[8px] sm:p-[10px] shadow-[0_18px_45px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.4)_inset] rotate-[0.4deg] sm:rotate-[0.7deg] border border-[#d4c9b8]/70">
              {/* Tape — top */}
              <div className="absolute -top-3 left-4 sm:left-8 w-[84px] h-[22px] bg-[#f0deb8]/90 border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.15)] rotate-[-2.2deg] backdrop-blur-[1px] z-10">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, transparent 4px)` }} />
              </div>
              <div className="absolute -top-2.5 right-6 sm:right-14 w-[72px] h-[20px] bg-[#f0deb8]/85 border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.12)] rotate-[1.8deg] z-10">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, transparent 4px)` }} />
              </div>

              {/* Paper inner — image */}
              <div className="relative bg-[#0f0e0d] border border-[#1a1816] overflow-hidden">
                {/* thin ink progress at top edge of paper */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-[#d4c9b8]/30 z-20">
                  <div
                    key={current}
                    className="h-full bg-[#1a1816]"
                    style={{
                      width: '100%',
                      transformOrigin: 'left',
                      animation: paused ? 'none' : 'shrinkWidth 5500ms linear forwards',
                    }}
                  />
                </div>

                <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-[#0f0e0d]">
                  {nextS && (
                    <img
                      key={`next-${fadingTo}`}
                      src={imgSrc(nextS.id)}
                      alt=""
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${transitioning ? 'opacity-100' : 'opacity-0'}`}
                      draggable={false}
                    />
                  )}
                  <img
                    key={`cur-${current}`}
                    src={imgSrc(s.id)}
                    alt={s.title || s.filename}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
                    draggable={false}
                  />
                  {/* subtle vignette, not gloss */}
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.25)]" />

                  {/* Top left — frame ticket, like a filing label */}
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex items-center gap-1.5">
                    <div className="bg-[#e8e0d0] border border-[#1a1816]/15 px-2 py-1 flex items-center gap-2 shadow-sm">
                      <span className="font-mono text-[10px] font-bold tracking-widest text-[#1a1816]">FRAME {String(current + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
                      <span className="hidden sm:inline w-px h-3 bg-black/15" />
                      <span className="hidden sm:inline font-mono text-[10px] tracking-wide text-[#5a5348]">{new Date(s.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                    {s.panorama && <span className="bg-[#1a1816] text-[#e8e0d0] font-mono text-[10px] font-bold tracking-widest px-2 py-1 border border-[#1a1816]">360°</span>}
                  </div>

                  {/* Bottom caption strip — paper, not glass */}
                  <div className="absolute bottom-0 inset-x-0 bg-[#e8e0d0] border-t-[1.5px] border-[#1a1816] flex gap-3 items-stretch z-10">
                    <div className="flex-1 min-w-0 px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {s.world && (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest font-bold px-2 py-1 bg-[#1a1816] text-[#e8e0d0] border border-[#1a1816]">
                            ● {s.world.name.toUpperCase()}
                          </span>
                        )}
                        <span className="font-mono text-[10px] tracking-wide text-[#8d847a] hidden sm:inline">{s.panorama ? 'PANORAMA' : 'SCREENSHOT'} • {s.width ?? '—'}×{s.height ?? '—'}</span>
                      </div>
                      <div className={`mt-1 transition-all duration-400 ${transitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
                        <h2 className="font-serif text-[17px] sm:text-[19px] font-bold leading-none tracking-[-0.02em] text-[#1a1816] truncate">{s.title || s.filename}</h2>
                        {s.description && <p className="hidden sm:block mt-1 font-mono text-[11px] leading-snug text-[#5a5348] line-clamp-1">{s.description}</p>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.tags?.slice(0, 3).map(t => (
                          <span key={t.id} className="font-hand text-[13px] leading-none text-[#5a5348] bg-white/60 border border-black/10 px-2 py-1 rotate-[-0.5deg]">#{t.name}</span>
                        ))}
                        {s.tags && s.tags.length > 3 && <span className="font-mono text-[10px] text-[#8d847a] self-center">+{s.tags.length - 3}</span>}
                        {s.tags?.length === 0 && <span className="font-hand text-[13px] text-[#8d847a]">— untagged</span>}
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-col justify-between items-end p-3 border-l border-dashed border-black/15 bg-[#f2ede6]/60 min-w-[124px]">
                      <Link
                        href={`/gallery?world=${s.world?.slug ?? ''}`}
                        className="w-full text-center font-mono text-[11px] tracking-widest font-bold px-3 py-2 bg-[#1a1816] text-[#e8e0d0] hover:bg-black border border-[#1a1816] transition-colors"
                      >
                        VIEW WORLD ↗
                      </Link>
                      <span className="font-mono text-[9px] tracking-wide text-[#8d847a]">FILE #{s.id.slice(0, 6).toUpperCase()}</span>
                    </div>

                    {/* mobile arrow */}
                    <Link href={`/gallery?world=${s.world?.slug ?? ''}`} className="sm:hidden self-center mr-3 w-8 h-8 bg-[#1a1816] text-[#e8e0d0] grid place-items-center border border-[#1a1816] shrink-0">
                      <span className="text-[14px]">→</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bottom paper footer — typewriter */}
              <div className="flex items-center justify-between pt-2 px-1 font-mono text-[9px] sm:text-[10px] tracking-[0.14em] text-[#5a5348]">
                <span>CHUNKJOURNAL // SHEET 01 — ARCHIVE PREVIEW</span>
                <span className="flex items-center gap-2">
                  <span className="hidden sm:inline w-1.5 h-1.5 bg-[#c45a3a] rounded-full" />
                  <span className="hidden sm:inline">{paused ? 'PAUSED' : 'AUTO 5.5s'}</span>
                  <span className="flex items-center gap-1 ml-1">
                    <button onClick={() => go(-1)} className="w-6 h-6 grid place-items-center border border-[#1a1816]/15 bg-white/60 hover:bg-[#1a1816] hover:text-[#e8e0d0] transition-colors" aria-label="Previous">‹</button>
                    <button onClick={() => go(1)} className="w-6 h-6 grid place-items-center border border-[#1a1816] bg-[#1a1816] text-[#e8e0d0] hover:bg-black transition-colors" aria-label="Next">›</button>
                  </span>
                </span>
              </div>

              {/* dots — minimal, not pills */}
              {n > 1 && (
                <div className="hidden sm:flex items-center gap-1 justify-center pt-1.5">
                  {screenshots.slice(0, 8).map((_, i) => (
                    <button key={i} onClick={() => goTo(i)} aria-label={`Go to ${i + 1}`} className={`h-[5px] transition-all border ${i === current ? 'w-6 bg-[#1a1816] border-[#1a1816]' : 'w-[5px] bg-transparent border-[#1a1816]/25 hover:border-[#1a1816]/50'}`} />
                  ))}
                  {n > 8 && <span className="font-mono text-[9px] text-[#8d847a] ml-1">+{n - 8}</span>}
                </div>
              )}
            </div>

            {/* Handwritten note to side */}
            <div className="hidden xl:block absolute -right-6 top-1/2 -translate-y-1/2 rotate-[1.2deg]">
              <div className="font-hand text-[13px] leading-tight text-[#d4c9b8]/60 whitespace-nowrap">
                <div>→ tap image to pause</div>
                <div className="text-[#a9b998]/50">— catalogued {new Date().getFullYear()}</div>
              </div>
            </div>

            {/* Mobile dots */}
            {n > 1 && (
              <div className="flex sm:hidden items-center justify-center gap-1 mt-3">
                {screenshots.slice(0, 8).map((_, i) => (
                  <button key={i} onClick={() => goTo(i)} className={`h-[4px] border transition-all ${i === current ? 'w-5 bg-[#e8e0d0] border-[#e8e0d0]' : 'w-[4px] bg-transparent border-white/20'}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 lg:mt-8 h-px w-full bg-[#25211e]" />
    </div>
  )
}
