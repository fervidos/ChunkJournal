import { prisma } from "@/lib/prisma";
import HeroShowcase from "@/components/home/HeroShowcase";
import type { ScreenshotData } from "@/lib/types";

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let screenshots: ScreenshotData[] = []
  let totalScreenshots = 0
  let totalWorlds = 0
  let totalTags = 0

  try {
    const [screenshotRows, worldCount, tagCount] = await Promise.all([
      prisma.screenshot.findMany({
        orderBy: { date: "desc" },
        take: 48,
        include: {
          world: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: { select: { id: true, name: true } } } },
        },
      }),
      prisma.world.count(),
      prisma.tag.count(),
    ])

    screenshots = screenshotRows
      .slice(0, 20)
      .map((s) => ({
        ...s,
        tags: s.tags.map((st) => st.tag),
        date: s.date.toISOString(),
        createdAt: s.createdAt.toISOString(),
      }))

    totalScreenshots = await prisma.screenshot.count()
    totalWorlds = worldCount
    totalTags = tagCount
  } catch (e) {
    console.log('Database not available, running without data', e)
  }

  return (
    <div className="flex-1 flex flex-col">
      <HeroShowcase
        initialScreenshots={screenshots}
        totalScreenshots={totalScreenshots}
        totalWorlds={totalWorlds}
        totalTags={totalTags}
      />
      <footer className="py-8 px-8 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span className="text-[var(--color-text-dim)] text-sm font-medium tracking-wide">ChunkJournal</span>
          <span className="text-center max-w-md leading-relaxed">
            Every world holds a story, every build a memory. This archive is my way of keeping those moments alive and sharing them with anyone who&apos;s curious enough to explore.
          </span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}
