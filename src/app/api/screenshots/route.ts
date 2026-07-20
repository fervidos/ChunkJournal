import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const worldSlug = searchParams.get('world')
  const tag = searchParams.get('tag')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort') || 'newest'

  const where: Record<string, unknown> = {}

  if (worldSlug) {
    where.world = { slug: worldSlug }
  }
  if (tag) {
    where.tags = { some: { tag: { name: tag } } }
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const orderBy =
    sort === 'oldest'
      ? { date: 'asc' as const }
      : sort === 'name'
        ? { filename: 'asc' as const }
        : { date: 'desc' as const }

  const screenshots = await prisma.screenshot.findMany({
    where,
    orderBy,
    include: {
      world: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  })

  const data = screenshots.map((s) => ({
    ...s,
    tags: s.tags.map((st) => st.tag),
    date: s.date.toISOString(),
    createdAt: s.createdAt.toISOString(),
    panorama: s.panorama,
  }))

  return Response.json({ data, total: data.length })
}
