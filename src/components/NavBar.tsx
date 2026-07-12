'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getClientToken, clearClientToken } from '@/lib/auth'

export default function NavBar() {
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    setAuthed(!!getClientToken())
  }, [])

  function handleLogout() {
    clearClientToken()
    setAuthed(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="text-base sm:text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity">
          <span className="text-[var(--color-accent)]">Chunk</span>Journal
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/gallery" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors">
            Gallery
          </Link>
          {authed ? (
            <button onClick={handleLogout} className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors">
              Logout
            </button>
          ) : (
            <Link href="/login" className="text-sm px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-all duration-200">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
