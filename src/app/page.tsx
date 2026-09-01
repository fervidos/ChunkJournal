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
      <footer className="border-t border-[#25211e] bg-[#0f0e0d]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid sm:grid-cols-3 gap-8 items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 border-[1.5px] border-[#a9b998] bg-[#1a1816] grid place-items-center rotate-[-1deg]">
                  <span className="font-mono text-[9px] font-bold tracking-widest text-[#a9b998]">CJ</span>
                </span>
                <span className="font-serif text-[15px] font-black tracking-tight"><span className="text-[#a9b998]">Chunk</span><span className="text-[#f2ede6]">Journal</span></span>
                <span className="font-mono text-[9px] tracking-widest text-white/30 border border-white/15 px-1.5 py-0.5">ARCHIVE 01</span>
              </div>
              <p className="text-[13px] leading-relaxed text-white/50 max-w-[32ch]">
                Every world holds a story, every build a memory. This archive is my way of keeping those moments alive and sharing them with anyone curious enough to explore.
              </p>
              <div className="font-hand text-[13px] text-[#a9b998]/70 rotate-[-0.5deg]">— ink on paper, block by block</div>
            </div>

            <div className="sm:text-center">
              <div className="font-mono text-[11px] tracking-[0.14em] text-white/30 mb-3">NAVIGATE</div>
              <div className="flex sm:justify-center gap-2 flex-wrap font-mono text-[11px] tracking-widest">
                <a href="/gallery" className="px-3 py-1.5 border border-white/15 text-white/60 hover:text-[#f2ede6] hover:border-white/30 hover:bg-white/[0.03] transition-colors">GALLERY</a>
                <a href="/login" className="px-3 py-1.5 border border-white/15 text-white/60 hover:text-[#f2ede6] hover:border-white/30 hover:bg-white/[0.03] transition-colors">CURATOR</a>
                <span className="px-3 py-1.5 text-white/25">© {new Date().getFullYear()}</span>
              </div>
              <div className="mt-4 hidden sm:flex justify-center">
                <div className="w-20 h-px bg-white/10" />
              </div>
            </div>

            <div className="sm:text-right">
              <div className="font-mono text-[11px] tracking-[0.14em] text-white/30 mb-3">AT A GLANCE</div>
              <div className="inline-flex sm:ml-auto gap-0 text-left border-[1.5px] border-[#a9b998]/30 bg-[#1a1816] p-0 overflow-hidden">
                {[
                  [totalScreenshots, 'SHOTS'],
                  [totalWorlds, 'WORLDS'],
                  [totalTags, 'TAGS'],
                ].map(([v, k], i) => (
                  <div key={String(k)} className={`px-4 py-3 text-center ${i !== 2 ? 'border-r border-[#a9b998]/20' : ''}`}>
                    <div className="font-serif text-[18px] font-black leading-none text-[#f2ede6]">{v as number}</div>
                    <div className="font-mono text-[9px] tracking-widest text-white/40 mt-1">{k as string}</div>
                  </div>
                )) as any}
              </div>
              <div className="mt-2 font-mono text-[9px] tracking-wide text-white/25">STAMPED • {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}</div>
            </div>
          </div>
          <div className="mt-8 pt-5 border-t border-dashed border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[10px] tracking-wide text-white/25">
            <span>CHUNK BY CHUNK • BUILT WITH BLOCKS • NEXT.JS 16 • TAILWIND 4</span>
            <span className="flex items-center gap-2">Made for the curious <span className="w-1 h-1 bg-[#a9b998]" /> <span className="text-white/40">Minecraft® not affiliated</span></span>
          </div>
        </div>
      </footer>
    </div>
  )
}
