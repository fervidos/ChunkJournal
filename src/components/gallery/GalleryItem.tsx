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
        key={screenshot.id}
        src={imgSrc}
        alt={screenshot.title || screenshot.filename}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover block transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {screenshot.panorama && (
        <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[0.625rem] font-medium text-white/90 flex items-center gap-1 pointer-events-none">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
          </svg>
          360°
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pointer-events-none bg-gradient-to-t from-black/80 via-black/20 to-transparent pt-8" />
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pointer-events-none">
        <div className="text-sm text-white/90 font-medium truncate leading-tight">
          {screenshot.title || screenshot.filename}
        </div>
        {screenshot.description && (
          <div className="text-xs text-white/50 truncate leading-tight mt-px">
            {screenshot.description}
          </div>
        )}
      </div>
    </button>
  )
}
