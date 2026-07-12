import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createWorldSchema } from '@/lib/schema'
import slugify from '@/lib/slugify'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const worlds = await prisma.world.findMany({
    include: { _count: { select: { screenshots: true } } },
    orderBy: { name: 'asc' },
  })
  return Response.json(worlds)
}

export async function POST(req: NextRequest) {
  const unauthorized = requireAdmin(req)
  if (unauthorized) return unauthorized

  const body = await req.json()
  const parsed = createWorldSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const slug = slugify(parsed.data.name)
  const world = await prisma.world.upsert({
    where: { slug },
    create: { name: parsed.data.name, slug },
    update: {},
  })
  return Response.json(world, { status: 201 })
}
