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
      <footer className="border-t border-white/[0.06] bg-[#0e0d0c]/60 backdrop-blur">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid sm:grid-cols-3 gap-8 items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[var(--color-accent)] grid place-items-center">
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none" className="text-black"><rect x="1" y="1" width="7" height="7" rx="1" fill="currentColor" /><rect x="10" y="1" width="7" height="7" rx="1" fill="currentColor" opacity="0.7"/><rect x="1" y="10" width="7" height="7" rx="1" fill="currentColor" opacity="0.6"/><rect x="10" y="10" width="7" height="7" rx="1" fill="currentColor" /></svg>
                </span>
                <span className="text-sm font-black tracking-tight"><span className="text-[var(--color-accent)]">Chunk</span><span className="text-white">Journal</span></span>
                <span className="text-[10px] font-mono tracking-widest text-white/25 border border-white/10 rounded-full px-1.5 py-0.5">ARCHIVE 01</span>
              </div>
              <p className="text-[13px] leading-relaxed text-white/50 max-w-[32ch]">
                Every world holds a story, every build a memory. This archive is my way of keeping those moments alive and sharing them with anyone curious enough to explore.
              </p>
            </div>

            <div className="sm:text-center">
              <div className="text-[11px] font-mono tracking-[0.14em] text-white/30 mb-3">NAVIGATE</div>
              <div className="flex sm:justify-center gap-2 flex-wrap">
                <a href="/gallery" className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/10 transition-colors">Gallery</a>
                <a href="/login" className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/10 transition-colors">Curator Login</a>
                <span className="text-xs px-3 py-1.5 rounded-full border border-transparent text-white/25">© {new Date().getFullYear()}</span>
              </div>
              <div className="mt-4 hidden sm:flex justify-center">
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-[11px] font-mono tracking-[0.14em] text-white/30 mb-3">AT A GLANCE</div>
              <div className="inline-flex sm:ml-auto gap-6 text-left border border-white/10 rounded-2xl bg-white/[0.02] px-4 py-3 backdrop-blur">
                <div>
                  <div className="text-lg font-black leading-none text-white">{totalScreenshots}</div>
                  <div className="text-[10px] font-mono tracking-widest text-white/35">SHOTS</div>
                </div>
                <div className="w-px bg-white/10" />
                <div>
                  <div className="text-lg font-black leading-none text-white">{totalWorlds}</div>
                  <div className="text-[10px] font-mono tracking-widest text-white/35">WORLDS</div>
                </div>
                <div className="w-px bg-white/10" />
                <div>
                  <div className="text-lg font-black leading-none text-white">{totalTags}</div>
                  <div className="text-[10px] font-mono tracking-widest text-white/35">TAGS</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-white/25">
            <span className="tracking-wide">CHUNK BY CHUNK • BUILT WITH BLOCKS • NEXT.JS 16 • TAILWIND 4</span>
            <span className="flex items-center gap-2">Made for the curious <span className="w-1 h-1 rounded-full bg-[var(--color-accent)]" /> <span className="text-white/40">Minecraft® not affiliated</span></span>
          </div>
        </div>
      </footer>
    </div>
  )
}
