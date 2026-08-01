'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from './Sidebar'
import GalleryGrid from './GalleryGrid'
import Lightbox from './Lightbox'
import UploadZone from './UploadZone'
import { getClientToken, clearClientToken } from '@/lib/auth'
import type { ScreenshotData, WorldData } from '@/lib/types'

interface Props {
  worlds: WorldData[]
  tags: { id: string; name: string }[]
}

export default function GalleryPage({ worlds, tags: initialTags }: Props) {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tags, setTags] = useState(initialTags)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeWorld, setActiveWorld] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    setAuthed(!!getClientToken())
  }, [])

  const fetchScreenshots = useCallback(async (opts?: {
    world?: string | null
    tag?: string | null
    search?: string
    sort?: string
  }) => {
    setLoading(true)
    const params = new URLSearchParams()
    const w = opts?.world ?? activeWorld
    const t = opts?.tag ?? activeTag
    const s = opts?.search ?? search
    const so = opts?.sort ?? sort
    if (w) params.set('world', w)
    if (t) params.set('tag', t)
    if (s) params.set('search', s)
    params.set('sort', so)

    try {
      const res = await fetch(`/api/screenshots?${params}`)
      const json = await res.json()
      setScreenshots(json.data)
      setTotal(json.total)
    } catch (e) {
      console.error('Failed to fetch screenshots', e)
    } finally {
      setLoading(false)
    }
  }, [activeWorld, activeTag, search, sort])

  const refreshTags = useCallback(async () => {
    try {
      const res = await fetch('/api/tags')
      if (res.ok) setTags(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchScreenshots()
  }, [fetchScreenshots])

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-[80vw] max-w-[300px] flex-shrink-0 shadow-2xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-60 lg:max-w-none lg:translate-x-0 lg:shadow-none pt-[env(safe-area-inset-top)] lg:pt-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          worlds={worlds}
          tags={tags}
          activeWorld={activeWorld}
          activeTag={activeTag}
          search={search}
          total={total}
          onClose={() => setSidebarOpen(false)}
          onWorldChange={(slug) => {
            setActiveWorld(slug)
            setSidebarOpen(false)
            fetchScreenshots({ world: slug })
          }}
          onTagChange={(name) => {
            setActiveTag(name)
            setSidebarOpen(false)
            fetchScreenshots({ tag: name })
          }}
          onSearchChange={(q) => {
            setSearch(q)
            fetchScreenshots({ search: q })
          }}
        />
      </div>
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
              aria-label="Open filters"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h2 className="text-sm text-[var(--color-text-dim)] truncate">
              <strong className="font-medium text-[var(--color-text)]">
                {activeWorld || 'All worlds'}
              </strong>
              <span className="hidden sm:inline">
                {' '}&middot;{' '}
                {loading ? '...' : `${total} screenshots`}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                fetchScreenshots({ sort: e.target.value })
              }}
              className="text-xs px-3 py-2 sm:py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-dim)] outline-none cursor-pointer flex-shrink-0"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name</option>
            </select>
            {authed ? (
              <>
                <button
                  onClick={() => setShowUpload(true)}
                  className="text-xs px-3 py-2 sm:py-1.5 rounded-lg bg-[var(--color-accent)] text-black font-medium hover:bg-[var(--color-accent-dim)] transition-colors flex-shrink-0"
                >
                  + Upload
                </button>
                <button
                  onClick={() => { clearClientToken(); setAuthed(false) }}
                  className="hidden sm:inline-flex text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-xs px-3 py-2 sm:py-1.5 rounded-lg border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors flex-shrink-0"
              >
                Login
              </Link>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <GalleryGrid
            screenshots={screenshots}
            loading={loading}
            onSelect={(index) => setLightboxIndex(index)}
          />
        </div>
      </main>

      {lightboxIndex !== null && (
        <Lightbox
          screenshots={screenshots}
          index={lightboxIndex}
          worlds={worlds}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(Math.max(0, lightboxIndex - 1))}
          onNext={() =>
            setLightboxIndex(Math.min(screenshots.length - 1, lightboxIndex + 1))
          }
          onMutated={() => {
            fetchScreenshots()
            refreshTags()
          }}
        />
      )}

      {showUpload && (
        <UploadZone
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false)
            fetchScreenshots()
            refreshTags()
          }}
          worlds={worlds}
        />
      )}
    </div>
  )
}
