import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/s3'
import { updateScreenshotSchema } from '@/lib/schema'
import { requireAdmin } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const screenshot = await prisma.screenshot.findUnique({
    where: { id },
    include: {
      world: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  })
  if (!screenshot) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  return Response.json({
    ...screenshot,
    tags: screenshot.tags.map((st) => st.tag),
    date: screenshot.date.toISOString(),
    createdAt: screenshot.createdAt.toISOString(),
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await req.json()
  const parsed = updateScreenshotSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { tags, date, worldId, ...fields } = parsed.data

  const updateData: Record<string, unknown> = { ...fields }
  if (date) updateData.date = new Date(date)
  if (worldId !== undefined) updateData.worldId = worldId

  if (tags !== undefined) {
    await prisma.screenshotTag.deleteMany({ where: { screenshotId: id } })
    if (tags.length > 0) {
      const tagRecords = await Promise.all(
        tags.map((name) =>
          prisma.tag.upsert({
            where: { name },
            create: { name },
            update: {},
          })
        )
      )
      await prisma.screenshotTag.createMany({
        data: tagRecords.map((t) => ({ screenshotId: id, tagId: t.id })),
      })
    }
  }

  const screenshot = await prisma.screenshot.update({
    where: { id },
    data: updateData,
    include: {
      world: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  })

  return Response.json({
    ...screenshot,
    tags: screenshot.tags.map((st) => st.tag),
    date: screenshot.date.toISOString(),
    createdAt: screenshot.createdAt.toISOString(),
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdmin(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  const screenshot = await prisma.screenshot.findUnique({
    where: { id },
    select: { s3Key: true, thumbnailS3Key: true },
  })
  if (!screenshot) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const deleteOps = [deleteFile(screenshot.s3Key)]
  if (screenshot.thumbnailS3Key) {
    deleteOps.push(deleteFile(screenshot.thumbnailS3Key))
  }

  await Promise.all([
    ...deleteOps,
    prisma.screenshot.delete({ where: { id } }),
  ])

  return new Response(null, { status: 204 })
}
