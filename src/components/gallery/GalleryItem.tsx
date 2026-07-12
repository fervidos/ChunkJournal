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
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/30 px-2.5 pt-6 pb-2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pointer-events-none">
        <div className="text-sm text-white/90 font-medium truncate">
          {screenshot.title || screenshot.filename}
        </div>
        {screenshot.description && (
          <div className="text-xs text-white/50 truncate mt-px">
            {screenshot.description}
          </div>
        )}
      </div>
    </button>
  )
}
