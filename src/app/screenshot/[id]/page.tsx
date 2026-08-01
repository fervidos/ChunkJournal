import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getSignedDownloadUrl } from "@/lib/s3"
import ScreenshotViewer from "@/components/screenshot/ScreenshotViewer"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chunkjournal.vercel.app'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const screenshot = await prisma.screenshot.findUnique({
    where: { id },
    select: { title: true, description: true, filename: true, s3Key: true, panorama: true },
  })
  if (!screenshot) return {}

  const title = screenshot.title || screenshot.filename
  const description = screenshot.description || 'A screenshot from ChunkJournal'
  const s3Url = await getSignedDownloadUrl(screenshot.s3Key)
  const imageUrl = s3Url || `${siteUrl}/api/screenshots/${id}/download`

  return {
    title: `${title} — ChunkJournal`,
    description,
    openGraph: {
      title: `${title} — ChunkJournal`,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — ChunkJournal`,
      description,
      images: [imageUrl],
    },
  }
}

export default async function ScreenshotPage({ params }: Props) {
  const { id } = await params
  const screenshot = await prisma.screenshot.findUnique({
    where: { id },
    include: {
      world: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  })
  if (!screenshot) notFound()

  const data = {
    ...screenshot,
    tags: screenshot.tags.map((st) => st.tag),
    date: screenshot.date.toISOString(),
    createdAt: screenshot.createdAt.toISOString(),
  }

  // 2400px webp is crisp at any container width up to 5xl while keeping mobile
  // data usage sane (panoramas go through their own preview downscale).
  const imgSrc = `/api/screenshots/${id}/download?width=2400`

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl">
        <a
          href="/gallery"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-dim)] transition-colors mb-6"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to gallery
        </a>
        <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <ScreenshotViewer
            panorama={screenshot.panorama}
            imageUrl={imgSrc}
            alt={data.title || data.filename}
          />
          <div className="p-6 flex flex-col gap-3">
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{data.title || data.filename}</h1>
            {data.description && (
              <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">{data.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {data.world && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                  {data.world.name}
                </span>
              )}
              {data.tags?.map((t) => (
                <span key={t.id} className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-dim)] border border-[var(--color-border)]">
                  #{t.name}
                </span>
              ))}
            </div>
            {data.date && (
              <div className="text-xs text-[var(--color-text-muted)]">
                {new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}