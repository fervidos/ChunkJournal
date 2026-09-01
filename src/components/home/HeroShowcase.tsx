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
    const filtered = initialScreenshots.filter((s) => !s.panorama)
    const pool = filtered.length >= 4 ? filtered : initialScreenshots
    const a = [...pool]
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
          <div className="font-mono text-[11px] tracking-[0.16em] text-[#8d847a] mb-3">ARCHIVE — EMPTY</div>
          <h3 className="font-serif text-[22px] font-bold tracking-tight text-[#1a1816] leading-none">Waiting for the first block.</h3>
          <Link href="/gallery" className="mt-6 inline-flex text-[12px] font-mono tracking-widest px-4 py-2 bg-[#1a1816] text-[#e8e0d0] hover:bg-black transition-colors">BEGIN →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative flex flex-col">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="grid lg:grid-cols-[0.95fr_1.35fr] gap-10 lg:gap-16 xl:gap-20 items-center">

          {/* LEFT — headline, one line, one CTA */}
          <div className="flex flex-col relative z-10">
            <h1 className="font-serif font-black tracking-[-0.04em] leading-[0.86] text-[46px] sm:text-[58px] lg:text-[64px]">
              <span className="block text-[#a9b998]">Chunk</span>
              <span className="block text-[#f2ede6] -mt-1">Journal</span>
            </h1>

            <p className="mt-5 text-[15px] leading-[1.65] text-[#d4c9b8] max-w-[32ch]">
              A place for the worlds we build and the people who make them special.
            </p>

            <div className="mt-7">
              <Link
                href="/gallery"
                className="inline-flex items-center gap-3 px-5 py-3 bg-[#e8e0d0] text-[#1a1816] font-mono text-[12px] tracking-[0.12em] font-bold border border-[#d4c9b8] shadow-[3px_3px_0_rgba(0,0,0,0.22)] hover:shadow-[2px_2px_0_rgba(0,0,0,0.22)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                ENTER GALLERY <span className="w-5 h-5 border border-[#1a1816] grid place-items-center text-[11px]">→</span>
              </Link>
            </div>
          </div>

          {/* RIGHT — pinned print, minimal caption: world + title only */}
          <div className="relative lg:mt-1 lg:-ml-3 lg:translate-y-2">
            <div className="hidden lg:block absolute -top-2 left-1/2 -translate-x-1/2 z-20">
              <div className="w-3.5 h-3.5 rounded-full bg-[#c45a3a] border-[1.5px] border-[#9a3a1e] shadow-[0_2px_5px_rgba(0,0,0,0.35)] relative">
                <div className="absolute inset-[3px] rounded-full bg-white/20" />
                <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-[1.5px] h-[6px] bg-[#5a5348]" />
              </div>
            </div>

            <div className="relative bg-[#e8e0d0] p-[9px] sm:p-[10px] shadow-[4px_6px_0_rgba(0,0,0,0.18),0_16px_40px_rgba(0,0,0,0.35)] border border-[#d4c9b8] rotate-[0.7deg] overflow-hidden">
              {/* paper grain — tactile, not flat */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")` }} />
              {/* hand-torn edge hint — subtle irregular shadow line */}
              <div className="pointer-events-none absolute inset-0 border border-[#1a1816]/5" style={{ clipPath: `polygon(0 0, 100% 0.3%, 99.7% 100%, 0.2% 99.8%)` }} />
              <div className="absolute -top-3 left-6 sm:left-8 w-[88px] h-[22px] bg-[#f0deb8] border border-black/[0.07] shadow-[0_1px_3px_rgba(0,0,0,0.14)] rotate-[-2.2deg] z-10">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 4px, black 4px, transparent 5px)` }} />
                {/* subtle wrinkle crease — human imperfection */}
                <div className="absolute top-1/2 left-1/2 w-[1px] h-[14px] bg-black/10 rotate-12 -translate-x-1/2 -translate-y-1/2" />
              </div>

              <div className="relative bg-[#0f0e0d] border border-[#1a1816] overflow-hidden">
                <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-[#0f0e0d]">
                  {nextS && (
                    <img key={`n-${fadingTo}`} src={imgSrc(nextS.id)} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-450 ${transitioning ? 'opacity-100' : 'opacity-0'}`} draggable={false} />
                  )}
                  <img key={`c-${current}`} src={imgSrc(s.id)} alt={s.title || s.filename} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-450 ${transitioning ? 'opacity-0' : 'opacity-100'}`} draggable={false} />
                </div>

                {/* Minimal caption: world pill + title + quiet nav */}
                <div className="bg-[#e8e0d0] border-t-[1.5px] border-[#1a1816] px-3 sm:px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    {s.world && <div className="font-mono text-[10px] tracking-widest font-bold text-[#8d847a] mb-1">{s.world.name.toUpperCase()}</div>}
                    <h2 className={`font-serif text-[16px] sm:text-[17px] font-bold leading-none tracking-[-0.02em] text-[#1a1816] truncate transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>{s.title || s.filename}</h2>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => go(-1)} className="w-7 h-7 grid place-items-center border border-[#1a1816]/20 bg-white text-[#1a1816] hover:bg-[#1a1816] hover:text-[#e8e0d0] transition-colors text-[16px] leading-none" aria-label="Prev">‹</button>
                    <button onClick={() => go(1)} className="w-7 h-7 grid place-items-center border border-[#1a1816] bg-[#1a1816] text-[#e8e0d0] hover:bg-black transition-colors text-[16px] leading-none" aria-label="Next">›</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 h-px w-full bg-[#25211e]" />
    </div>
  )
}
