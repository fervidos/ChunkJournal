'use client'

import { useState } from 'react'
import type { ScreenshotData } from '@/lib/types'

interface Props {
  screenshot: ScreenshotData
  onSelect: () => void
}

// Newly uploaded panoramas get a thumbnail cropped to the centre 50 % of
// the equirectangular height (see upload route), yielding a ~4:1 image
// that already excludes the stretched poles.  The 2.4:1 aspect ratio
// below makes object-cover crop the sides instead, showing the centre
// front-facing band of the panorama.
//
// For older uploads whose thumbnail is the full 2:1 equirectangular,
// the same CSS crops top / bottom (poles) instead — still better than
// the default w-full h-full.
//
// Note: the Tailwind class is written literally (not built from a
// variable) — Tailwind's compiler only picks up class names it can see as
// plain text in source, so an interpolated `aspect-[${x}]` would silently
// fail to generate the CSS.
const PANORAMA_IMG_CLASSES =
  'absolute left-1/2 top-1/2 h-full w-auto -translate-x-1/2 -translate-y-1/2 aspect-[12/5]'

export default function GalleryItem({ screenshot, onSelect }: Props) {
  const [loaded, setLoaded] = useState(false)
  const isPanorama = Boolean(screenshot.panorama)

  const imgSrc = `/api/screenshots/${screenshot.id}/download?thumb=1`

  return (
    <button
      onClick={onSelect}
      className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-left shadow-[0_10px_22px_rgba(0,0,0,0.12)] cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-border-light)] hover:shadow-[0_18px_30px_rgba(0,0,0,0.18)]"
    >
      <img
        key={screenshot.id}
        src={imgSrc}
        alt={screenshot.title || screenshot.filename}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={[
          'block object-cover transition-opacity duration-300',
          isPanorama ? PANORAMA_IMG_CLASSES : 'w-full h-full',
          loaded ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />
      {screenshot.panorama && (
        <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[0.625rem] font-medium text-white/90 flex items-center gap-1 pointer-events-none">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
          </svg>
          360°
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pointer-events-none">
        <div className="text-sm text-white font-medium truncate leading-tight drop-shadow-sm">
          {screenshot.title || screenshot.filename}
        </div>
        {screenshot.description && (
          <div className="text-[11px] text-white/65 truncate leading-tight mt-0.5 drop-shadow-sm">
            {screenshot.description}
          </div>
        )}
      </div>
    </button>
  )
}