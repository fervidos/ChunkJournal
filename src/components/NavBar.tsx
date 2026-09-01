'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getClientToken, clearClientToken } from '@/lib/auth'

export default function NavBar() {
  const pathname = usePathname()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    setAuthed(!!getClientToken())
  }, [])

  if (pathname === '/gallery') return null

  function handleLogout() {
    clearClientToken()
    setAuthed(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0f0e0d] border-b border-[#25211e] pt-[env(safe-area-inset-top)]">
      {/* top field line — like a notebook header */}
      <div className="hidden sm:flex h-[22px] items-center justify-between px-6 lg:px-8 border-b border-dashed border-white/[0.07] bg-[#0f0e0d]">
        <span className="text-[10px] font-mono tracking-[0.16em] text-white/30">
          FIELD ARCHIVE — VOL. 01 — <span className="text-white/50">CHUNK BY CHUNK</span> — CATALOGUED
        </span>
        <span className="text-[10px] font-mono tracking-[0.14em] text-white/25 hidden lg:inline">
          EST. 2026 — SEED 3429 — COORD [ 115, -183 ]
        </span>
      </div>

      <nav className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-[56px] flex items-center justify-between gap-4">
        {/* Left — stamp + serif */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="relative w-[32px] h-[32px] shrink-0 border-[1.5px] border-[#a9b998] bg-[#1a1816] flex items-center justify-center rotate-[-1.5deg] group-hover:rotate-0 transition-transform">
            <span className="absolute inset-0 border border-white/10 m-[2px] pointer-events-none" />
            <span className="font-mono text-[9px] font-bold tracking-widest text-[#a9b998] leading-none text-center">
              C<span className="text-white/80">J</span>
            </span>
            <span className="absolute -top-1 -right-1 w-[6px] h-[6px] bg-[#a9b998] rounded-full hidden sm:block" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-[18px] font-black tracking-[-0.03em] leading-none">
              <span className="text-[#a9b998]">Chunk</span><span className="text-[#f2ede6]">Journal</span>
            </span>
            <span className="font-mono text-[10px] tracking-[0.14em] text-white/35 -mt-0.5 hidden sm:block">ARCHIVE 01 / INK + PAPER</span>
          </span>
        </Link>

        {/* Center — thin rules, not pills */}
        <div className="hidden md:flex items-center gap-4 text-[13px]">
          <Link href="/" className={`pb-1 border-b transition-colors ${pathname === '/' ? 'border-[#a9b998] text-[#f2ede6] font-medium' : 'border-transparent text-white/45 hover:text-white/80 hover:border-white/20'}`}>
            Journal
          </Link>
          <span className="text-white/15">/</span>
          <Link href="/gallery" className={`pb-1 border-b transition-colors ${pathname?.startsWith('/gallery') ? 'border-[#a9b998] text-[#f2ede6] font-medium' : 'border-transparent text-white/45 hover:text-white/80 hover:border-white/20'}`}>
            Gallery
          </Link>
          <span className="hidden lg:inline-flex ml-2 text-[11px] font-mono tracking-widest text-white/20 border border-white/10 px-2 py-1">
            SHEET 01 — 20 FRAMES
          </span>
        </div>

        {/* Right — text link + ink button */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <Link href="/gallery" className="hidden sm:inline-flex text-[13px] font-mono tracking-wide text-white/60 hover:text-[#f2ede6] underline underline-offset-4 decoration-white/20 hover:decoration-[#a9b998] transition-colors">
            Explore →
          </Link>
          <Link href="/gallery" className="sm:hidden text-[12px] font-mono tracking-widest text-white/60 border border-white/15 px-3 py-1.5">
            GALLERY
          </Link>

          {authed ? (
            <button
              onClick={handleLogout}
              className="text-[12px] font-mono tracking-widest px-3.5 py-[7px] border border-white/15 bg-transparent text-white/70 hover:bg-white hover:text-black hover:border-white transition-colors"
            >
              LOGOUT
            </button>
          ) : (
            <Link
              href="/login"
              className="text-[12px] font-mono tracking-widest px-3.5 sm:px-4 py-[8px] bg-[#a9b998] text-[#0f0e0d] font-bold border border-[#a9b998] hover:bg-[#f2ede6] hover:border-[#f2ede6] transition-colors"
            >
              <span className="hidden sm:inline">CURATOR </span>LOGIN
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
