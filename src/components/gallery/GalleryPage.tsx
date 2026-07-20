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
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        worlds={worlds}
        tags={tags}
        activeWorld={activeWorld}
        activeTag={activeTag}
        search={search}
        total={total}
        onWorldChange={(slug) => {
          setActiveWorld(slug)
          fetchScreenshots({ world: slug })
        }}
        onTagChange={(name) => {
          setActiveTag(name)
          fetchScreenshots({ tag: name })
        }}
        onSearchChange={(q) => {
          setSearch(q)
          fetchScreenshots({ search: q })
        }}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-sm text-[var(--color-text-dim)]">
            <strong className="font-medium text-[var(--color-text)]">
              {activeWorld || 'All worlds'}
            </strong>
            {' '}&middot;{' '}
            {loading ? '...' : `${total} screenshots`}
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                fetchScreenshots({ sort: e.target.value })
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-dim)] outline-none cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name</option>
            </select>
            {authed ? (
              <>
                <button
                  onClick={() => setShowUpload(true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-black font-medium hover:bg-[var(--color-accent-dim)] transition-colors"
                >
                  + Upload
                </button>
                <button
                  onClick={() => { clearClientToken(); setAuthed(false) }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
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
