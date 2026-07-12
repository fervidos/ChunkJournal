'use client'

import { useState } from 'react'
import type { ScreenshotData } from '@/lib/types'

interface Props {
  screenshot: ScreenshotData
  onSelect: () => void
}

export default function GalleryItem({ screenshot, onSelect }: Props) {
  const [loaded, setLoaded] = useState(false)

  const imgSrc = `/api/screenshots/${screenshot.id}/download?thumb=1`

  return (
    <button
      onClick={onSelect}
      className="group relative aspect-[16/10] rounded-lg overflow-hidden bg-[var(--color-bg-card)] border border-[var(--color-border)] cursor-pointer transition-all duration-250 hover:border-[var(--color-accent)] hover:scale-[1.02] text-left"
    >
      <img
        src={imgSrc}
        alt={screenshot.title || screenshot.filename}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover block transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250" />
      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none">
        <span className="text-xs text-white/85 font-medium">
          {screenshot.title || screenshot.filename}
        </span>
      </div>
    </button>
  )
}
