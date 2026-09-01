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
      <nav className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-[56px] flex items-center justify-between gap-4">
        {/* Left — wordmark only */}
        <Link href="/" className="flex items-center gap-1.5 group">
          <span className="font-serif text-[18px] font-black tracking-[-0.03em] leading-none group-hover:opacity-90 transition-opacity">
            <span className="text-[#a9b998]">Chunk</span><span className="text-[#f2ede6]">Journal</span>
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
              className="text-[13px] px-3.5 py-[7px] border border-white/15 bg-transparent text-white/70 hover:bg-white hover:text-black hover:border-white transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="text-[13px] px-4 py-[8px] bg-[#e8e0d0] text-[#1a1816] font-medium border border-[#d4c9b8] hover:bg-white transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
