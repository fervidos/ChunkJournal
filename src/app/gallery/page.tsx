import { prisma } from "@/lib/prisma";
import GalleryPage from "@/components/gallery/GalleryPage";

export const dynamic = 'force-dynamic'

export default async function GalleryRoute() {
  let worlds: Awaited<ReturnType<typeof prisma.world.findMany>> = []
  let tags: Awaited<ReturnType<typeof prisma.tag.findMany>> = []

  try {
    const [fetchedWorlds, fetchedTags] = await Promise.all([
      prisma.world.findMany({
        include: { _count: { select: { screenshots: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.tag.findMany({
        where: { screenshots: { some: {} } },
        orderBy: { name: "asc" },
      }),
    ])
    worlds = fetchedWorlds
    tags = fetchedTags
  } catch (e) {
    console.log('Database not available, running without data', e)
  }

  return <GalleryPage worlds={worlds} tags={tags} />
}
