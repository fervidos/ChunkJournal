'use client'

import dynamic from 'next/dynamic'

const PanoramaViewer = dynamic(() => import('@/components/gallery/PanoramaViewer'), { ssr: false })

interface Props {
  panorama: boolean
  imageUrl: string
  alt: string
}

export default function ScreenshotViewer({ panorama, imageUrl, alt }: Props) {
  if (panorama) {
    return (
      <div className="w-full aspect-[2/1] min-h-[50vh]">
        <PanoramaViewer imageUrl={imageUrl} />
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-auto block"
    />
  )
}
