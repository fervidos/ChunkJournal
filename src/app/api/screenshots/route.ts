import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const worldSlug = searchParams.get('world')
  const tag = searchParams.get('tag')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort') || 'newest'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '48', 10)))

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

  const [total, screenshots] = await Promise.all([
    prisma.screenshot.count({ where }),
    prisma.screenshot.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        world: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    }),
  ])

  const data = screenshots.map((s) => ({
    ...s,
    tags: s.tags.map((st) => st.tag),
    date: s.date.toISOString(),
    createdAt: s.createdAt.toISOString(),
  }))

  return Response.json({ data, total, page, limit })
}
