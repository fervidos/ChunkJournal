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
    <header className="sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
      {/* outer shell with hairline */}
      <div className="border-b border-white/[0.06] bg-[#0e0d0c]/70 backdrop-blur-[20px] supports-[backdrop-filter]:bg-[#0e0d0c]/60">
        <nav className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-[56px] sm:h-[60px] flex items-center justify-between gap-4">
          {/* Left — brand with mark */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <span className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--color-accent)] grid place-items-center shadow-[0_2px_12px_rgba(169,185,152,0.3)] group-hover:scale-[1.03] transition-transform">
                {/* pixel chunk icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-black">
                  <rect x="1" y="1" width="7" height="7" rx="1.2" fill="currentColor" opacity="0.95" />
                  <rect x="10" y="1" width="7" height="7" rx="1.2" fill="currentColor" opacity="0.75" />
                  <rect x="1" y="10" width="7" height="7" rx="1.2" fill="currentColor" opacity="0.65" />
                  <rect x="10" y="10" width="7" height="7" rx="1.2" fill="currentColor" opacity="1" />
                  <rect x="5.5" y="5.5" width="7" height="7" rx="1" fill="white" opacity="0.9" />
                </svg>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-[var(--color-accent)] hidden sm:block" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[15px] sm:text-[16px] font-black tracking-[-0.04em] whitespace-nowrap">
                  <span className="text-[var(--color-accent)]">Chunk</span><span className="text-white">Journal</span>
                </span>
                <span className="hidden sm:block text-[10px] font-mono tracking-[0.16em] text-white/35 -mt-0.5">ARCHIVE — 01 / CHUNK BY CHUNK</span>
              </span>
            </Link>

            <span className="hidden lg:block w-px h-7 bg-white/10 ml-1" />
            <span className="hidden lg:inline-flex items-center gap-2 text-[11px] font-mono tracking-wide text-white/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE • {new Date().getFullYear()}
            </span>
          </div>

          {/* Center — mini nav (desktop) */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur">
            <Link href="/" className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${pathname === '/' ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              Journal
            </Link>
            <Link href="/gallery" className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${pathname?.startsWith('/gallery') ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              Gallery
            </Link>
            <span className="px-2 text-white/15 text-xs">•</span>
            <span className="pr-2 text-[11px] font-mono tracking-widest text-white/30">SEED — 3429</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            <Link
              href="/gallery"
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-white/70 hover:text-white transition-colors px-2 py-1"
            >
              <span className="hidden lg:inline">Explore</span> Gallery
              <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
            </Link>

            {/* Mobile gallery pill */}
            <Link
              href="/gallery"
              className="sm:hidden inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-white/10 border border-white/10 text-white/90 backdrop-blur"
            >
              Gallery
            </Link>

            {authed ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3.5 sm:px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3.5 sm:px-4 py-2 rounded-full bg-[var(--color-accent)] text-black hover:bg-white transition-colors shadow-[0_4px_16px_rgba(169,185,152,0.25)]"
              >
                <span className="hidden sm:inline">Curator</span> Login
                <svg className="w-3.5 h-3.5 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" /></svg>
              </Link>
            )}
          </div>
        </nav>
      </div>

      {/* thin accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--color-accent)]/20 to-transparent opacity-60" />
    </header>
  )
}
