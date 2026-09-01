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
    }, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [current, n, paused])

  function advance(idx: number) {
    if (idx === current || fadingTo !== null) return
    setFadingTo(idx)
    setTimeout(() => {
      setCurrent(idx)
      setFadingTo(null)
    }, 650)
  }

  function goTo(idx: number) {
    if (idx === current || fadingTo !== null) return
    advance(idx)
    setPaused(true)
    setTimeout(() => setPaused(false), 9000)
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
      <div className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 mb-6 ring-1 ring-[var(--color-accent)]/20">
            <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text-dim)] mb-2">This story is waiting to be written</h3>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-8">Every great journey starts with a single block. Upload your first screenshot and begin your archive.</p>
          <Link href="/gallery" className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-full bg-[var(--color-accent)] text-black font-semibold hover:bg-white transition-colors">
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
      className="flex-1 relative flex flex-col isolate overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 w-[720px] h-[720px] rounded-full bg-[var(--color-accent)]/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[640px] h-[640px] rounded-full bg-[#c9a87a]/[0.06] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--color-bg)]/40" />
      </div>

      {/* Vertical marquee edge — desktop only */}
      <div className="hidden xl:flex absolute right-0 top-1/2 -translate-y-1/2 h-[70vh] items-center pointer-events-none select-none">
        <div className="rotate-90 origin-center whitespace-nowrap flex items-center gap-3 text-[10px] tracking-[0.28em] font-mono text-white/20">
          <span className="w-8 h-px bg-white/20" />
          COORD • X: 1847 &nbsp; Y: 64 &nbsp; Z: -2931 &nbsp; • &nbsp; CHUNK [ 115, -183 ] &nbsp; • &nbsp; SEED: - 492044728
          <span className="w-8 h-px bg-white/20" />
        </div>
      </div>

      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex-1 flex flex-col justify-center">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-10 items-center">

          {/* Left — editorial */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col relative">
            {/* Eyebrow pill */}
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 px-3 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]"></span>
              </span>
              <span className="text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--color-accent)]">Chunk by chunk — archive v.01</span>
              <span className="hidden sm:inline-flex ml-1 text-[10px] leading-none px-1.5 py-0.5 rounded-full bg-black/30 text-white/60 border border-white/10">{n} featured</span>
            </div>

            {/* Title */}
            <div className="relative mt-6">
              {/* Watermark behind */}
              <div className="pointer-events-none select-none absolute -top-10 -left-4 sm:-left-6 text-[84px] sm:text-[112px] lg:text-[128px] font-black leading-none tracking-[-0.08em] text-white/[0.03]">01</div>

              <h1 className="relative text-[44px] sm:text-[56px] lg:text-[68px] xl:text-[78px] font-black tracking-[-0.06em] leading-[0.84]">
                <span className="block text-[var(--color-accent)]">Chunk</span>
                <span className="block text-white -mt-1 lg:-mt-2 flex items-baseline gap-3">
                  Journal
                  <span className="hidden sm:inline-flex items-center justify-center w-7 h-7 lg:w-8 lg:h-8 rounded-full border border-white/15 text-[10px] font-mono font-medium tracking-widest text-white/40 -translate-y-2">®</span>
                </span>
              </h1>

              {/* Underline scribble */}
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1 w-12 rounded-full bg-[var(--color-accent)]" />
                <div className="h-px flex-1 max-w-[180px] bg-gradient-to-r from-[var(--color-accent)]/40 to-transparent" />
                <span className="text-[10px] font-mono tracking-[0.18em] text-white/30">EST • 2026</span>
              </div>
            </div>

            <p className="mt-6 text-[15px] sm:text-[16px] leading-[1.7] text-[var(--color-text-dim)] max-w-[46ch] border-l-2 border-[var(--color-accent)]/30 pl-4">
              A collection of the worlds I&apos;ve explored, the places I&apos;ve built, and the people I&apos;ve met along the way.
              <span className="text-white/80"> Every screenshot tells a story —</span> this is where I choose to keep them.
            </p>

            {/* CTAs */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/gallery"
                className="group relative inline-flex items-center gap-2.5 pl-6 pr-2 py-2 rounded-full bg-[var(--color-accent)] text-black font-semibold text-[14px] overflow-hidden transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.99]"
              >
                Enter the Gallery
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black text-white group-hover:bg-[var(--color-accent)] group-hover:text-black transition-colors">
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </Link>

              <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur text-sm font-medium text-white/80 hover:bg-white hover:text-black hover:border-white transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Curator login
              </Link>

              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-white/30 ml-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25L3.75 21l4.5-4.5V14.25l2.658-2.658c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>
                Press G to jump
              </span>
            </div>

            {/* Stats — as little cards */}
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-[420px]">
              {[
                { k: 'Screenshots', v: totalScreenshots, icon: '◧' },
                { k: 'Worlds', v: totalWorlds, icon: '◈' },
                { k: 'Tags', v: totalTags, icon: '#' },
              ].map((stat) => (
                <div key={stat.k} className="group relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur px-3 py-3 sm:px-4 sm:py-4 hover:bg-white/[0.07] hover:border-white/15 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-white/35">{stat.icon} {stat.k.toUpperCase()}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--color-accent)] opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="mt-1 text-[22px] sm:text-[26px] font-black tracking-[-0.04em] leading-none text-white">{stat.v}</div>
                  <div className="mt-1 h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-accent)] w-[62%] opacity-60 group-hover:w-[75%] transition-all duration-700" />
                  </div>
                </div>
              ))}
            </div>

            {/* Tiny foot note under stats — adds editorial flavour */}
            <div className="mt-3 hidden sm:flex items-center gap-2 text-[11px] font-mono text-white/25">
              <span>—</span>
              <span>catalogued & tagged, newest first</span>
              <span className="w-6 h-px bg-white/10" />
              <span className="text-white/40">↳ scroll to explore</span>
            </div>
          </div>

          {/* Right — showcase */}
          <div className="lg:col-span-7 xl:col-span-7 relative lg:pl-4">
            {/* Stack effect behind */}
            <div className="absolute inset-0 hidden lg:block pointer-events-none">
              <div className="absolute inset-0 rounded-[32px] bg-[var(--color-accent)]/10 rotate-[1.6deg] translate-x-3 translate-y-3 border border-[var(--color-accent)]/10" />
              <div className="absolute inset-0 rounded-[32px] bg-white/[0.03] -rotate-[1.2deg] translate-x-1.5 translate-y-1.5 border border-white/5" />
            </div>

            <div className="relative rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] overflow-hidden border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.06)_inset] bg-[#0f0e0d] group/showcase">

              {/* Progress rail */}
              <div className="absolute top-0 inset-x-0 h-[2px] z-20 bg-white/10">
                <div
                  key={current}
                  className={`h-full bg-[var(--color-accent)] ${paused ? '[animation-play-state:paused]' : ''}`}
                  style={{
                    width: '100%',
                    animation: 'shrinkWidth 5000ms linear forwards',
                    transformOrigin: 'left'
                  }}
                />
              </div>

              {/* Image layer */}
              <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] xl:aspect-[16/11] overflow-hidden bg-[var(--color-bg-card)]">
                {!loaded && (
                  <div className="absolute inset-0 animate-pulse bg-[#1a1918]">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent" />
                  </div>
                )}

                {nextS && (
                  <img
                    key={`next-${fadingTo}`}
                    src={imgSrc(nextS.id)}
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[650ms] ${transitioning ? 'opacity-100' : 'opacity-0'}`}
                    draggable={false}
                  />
                )}

                <img
                  key={`cur-${current}`}
                  src={imgSrc(s.id)}
                  alt={s.title || s.filename}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[650ms] ${transitioning ? 'opacity-0' : 'opacity-100'} ${paused ? '' : 'group-hover/showcase:scale-[1.03]'} transition-transform duration-[7000ms] ease-out`}
                  draggable={false}
                />

                {/* Film grain + vignette */}
                <div className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-20" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
                }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />
                <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] pointer-events-none rounded-[inherit]" />
                <div className="absolute inset-0 opacity-0 group-hover/showcase:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.08] pointer-events-none" />

                {/* Top meta bar */}
                <div className="absolute top-0 inset-x-0 p-3 sm:p-4 flex items-start justify-between gap-3 pointer-events-none">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/90">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                      LIVE ARCHIVE
                    </div>
                    <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/70">
                      <span className="hidden sm:inline text-white/40">FRAME</span> {String(current + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
                    </div>
                  </div>

                  {n > 1 && (
                    <div className="flex items-center gap-1.5 pointer-events-auto">
                      <button onClick={() => go(-1)} aria-label="Previous" className="w-8 h-8 sm:w-9 sm:h-9 grid place-items-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/80 hover:bg-white hover:text-black hover:border-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                      </button>
                      <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                        {screenshots.slice(0, 7).map((_, i) => (
                          <button key={i} onClick={() => goTo(i)} aria-label={`Go to ${i + 1}`} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/60'}`} />
                        ))}
                        {n > 7 && <span className="text-[10px] font-mono text-white/40 ml-1">+{n - 7}</span>}
                      </div>
                      <button onClick={() => go(1)} aria-label="Next" className="w-8 h-8 sm:w-9 sm:h-9 grid place-items-center rounded-full bg-white text-black border border-white hover:bg-white/90 transition-colors shadow-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Center play/pause hint — appears on hover */}
                <button
                  onClick={() => setPaused(p => !p)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/15 grid place-items-center text-white/90 opacity-0 group-hover/showcase:opacity-100 scale-90 group-hover/showcase:scale-100 transition-all duration-300 hover:bg-black/60"
                  aria-label={paused ? 'Play' : 'Pause'}
                >
                  {paused ? (
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5.14v14l11-7z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                  )}
                </button>

                {/* Bottom glass card */}
                <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 lg:p-5">
                  <div className={`rounded-[18px] sm:rounded-[20px] border border-white/10 bg-black/45 backdrop-blur-xl p-3.5 sm:p-4 flex gap-3 sm:gap-4 items-end transition-all duration-500 ${transitioning ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {s.world && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full bg-[var(--color-accent)] text-black">
                            <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
                            {s.world.name}
                          </span>
                        )}
                        <span className="hidden sm:inline-flex text-[11px] font-mono text-white/45">{new Date(s.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} • {s.panorama ? ' PANORAMA' : ' SCREENSHOT'}</span>
                        {s.panorama && <span className="inline-flex text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-white text-black">360°</span>}
                      </div>
                      <h2 className="text-[18px] sm:text-[20px] lg:text-[22px] font-bold leading-tight tracking-[-0.03em] text-white truncate">{s.title || s.filename}</h2>
                      {s.description && <p className="hidden sm:block mt-1 text-[13px] leading-snug text-white/60 line-clamp-1">{s.description}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {s.tags?.slice(0, 3).map(t => (
                          <span key={t.id} className="text-[11px] font-medium px-2 py-1 rounded-full bg-white/10 text-white/80 border border-white/10 backdrop-blur">#{t.name}</span>
                        ))}
                        {s.tags && s.tags.length > 3 && <span className="text-[11px] font-mono text-white/40">+{s.tags.length - 3}</span>}
                        {s.tags?.length === 0 && <span className="text-[11px] text-white/30 italic">untagged</span>}
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-col items-end gap-2 flex-shrink-0">
                      <Link
                        href={`/gallery?world=${s.world?.slug ?? ''}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full bg-white text-black hover:bg-[var(--color-accent)] transition-colors whitespace-nowrap"
                      >
                        View world
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                      </Link>
                      <span className="text-[10px] font-mono tracking-wide text-white/30 hidden lg:inline">CLICK TO EXPAND • ESC TO CLOSE</span>
                    </div>

                    {/* Mobile arrow */}
                    <div className="sm:hidden flex-shrink-0 w-9 h-9 rounded-full bg-white text-black grid place-items-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                    </div>
                  </div>

                  {/* Mobile dots below glass — simpler */}
                  {n > 1 && (
                    <div className="flex sm:hidden items-center justify-center gap-1 mt-3">
                      {screenshots.slice(0, 7).map((_, i) => (
                        <button key={i} onClick={() => goTo(i)} className={`h-1 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-1 bg-white/40'}`} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="hidden lg:flex items-center justify-between px-4 py-2.5 bg-black/60 backdrop-blur border-t border-white/5">
                <span className="text-[11px] font-mono tracking-[0.16em] text-white/30">CHUNKJOURNAL // ARCHIVE PREVIEW</span>
                <span className="text-[11px] font-mono text-white/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {paused ? 'PAUSED' : 'AUTO • 5.0s'}
                  <span className="hidden sm:inline text-white/20">—</span>
                  <span className="hidden sm:inline text-white/40">{s.width ?? '—'} × {s.height ?? '—'}</span>
                </span>
              </div>
            </div>

            {/* Floating tip — desktop */}
            <div className="hidden lg:flex absolute -bottom-6 -right-2 items-center gap-2 text-[11px] font-mono text-white/25">
              <span className="hidden xl:inline">drag to scrub • click tags to filter</span>
              <span className="w-6 h-px bg-white/10 hidden xl:inline" />
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 bg-white/[0.03]">
                <span className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />
                curated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade rule */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}
