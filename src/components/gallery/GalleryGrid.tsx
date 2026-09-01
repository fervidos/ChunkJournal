'use client'

import GalleryItem from './GalleryItem'
import type { ScreenshotData } from '@/lib/types'

interface Props {
  screenshots: ScreenshotData[]
  loading: boolean
  onSelect: (index: number) => void
}

export default function GalleryGrid({ screenshots, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[16/10] rounded-xl bg-[#1a1816] border border-[#25211e] animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (screenshots.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-8">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 mb-4">
            <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
            This archive is empty for now. Every masterpiece starts with a single screenshot.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 opacity-0 animate-[fadeIn_0.5s_ease_0.2s_forwards]">
      {screenshots.map((s, i) => (
        <GalleryItem key={s.id} screenshot={s} onSelect={() => onSelect(i)} />
      ))}
    </div>
  )
}
