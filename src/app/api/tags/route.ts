import { prisma } from '@/lib/prisma'

export async function GET() {
  const tags = await prisma.tag.findMany({
    where: { screenshots: { some: {} } },
    orderBy: { name: 'asc' },
  })
  return Response.json(tags)
}
