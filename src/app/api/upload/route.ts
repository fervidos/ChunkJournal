import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFile, generateS3Key, generateThumbnailS3Key } from '@/lib/s3'
import { createScreenshotSchema } from '@/lib/schema'
import { requireAdmin } from '@/lib/auth'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  const unauthorized = requireAdmin(req)
  if (unauthorized) return unauthorized

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return Response.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 413 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > 50 * 1024 * 1024) {
    return Response.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 413 })
  }

  const metadata = createScreenshotSchema.safeParse({
    title: formData.get('title') || null,
    description: formData.get('description') || null,
    date: formData.get('date') || null,
    worldId: formData.get('worldId') || null,
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : undefined,
  })

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const filename = file.name
  const mimeType = file.type || `image/${ext === 'png' ? 'png' : 'jpeg'}`

  let width: number | null = null
  let height: number | null = null
  let panorama = false

  try {
    const dims = await sharp(buffer).metadata()
    width = dims.width ?? null
    height = dims.height ?? null
    panorama = width !== null && height !== null && Math.abs(width / height - 2) < 0.01
  } catch {
    // fallback if sharp fails
  }

  const s3Key = generateS3Key('default', filename)
  const thumbnailS3Key = generateThumbnailS3Key(s3Key)

  let thumbnailBuffer: Buffer
  try {
    thumbnailBuffer = await sharp(buffer)
      .resize(400, undefined, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
  } catch {
    return Response.json({ error: 'Failed to process image. The file may be corrupted or unsupported.' }, { status: 422 })
  }

  try {
    await Promise.all([
      uploadFile(s3Key, buffer, mimeType),
      uploadFile(thumbnailS3Key, thumbnailBuffer, 'image/webp'),
    ])
  } catch {
    return Response.json({ error: 'Failed to upload to storage. Please try again.' }, { status: 502 })
  }

  const screenshot = await prisma.screenshot.create({
    data: {
      filename,
      mimeType,
      panorama,
      s3Key,
      width,
      height,
      fileSize: buffer.length,
      title: metadata.data?.title ?? null,
      description: metadata.data?.description ?? null,
      date: metadata.data?.date ? new Date(metadata.data.date) : new Date(),
      worldId: metadata.data?.worldId ?? null,
    },
    include: {
      world: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  })

  if (metadata.data?.tags?.length) {
    const tagRecords = await Promise.all(
      metadata.data.tags.map((name) =>
        prisma.tag.upsert({
          where: { name },
          create: { name },
          update: {},
        })
      )
    )
    await prisma.screenshotTag.createMany({
      data: tagRecords.map((t) => ({ screenshotId: screenshot.id, tagId: t.id })),
    })
  }

  const result = await prisma.screenshot.findUnique({
    where: { id: screenshot.id },
    include: {
      world: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  })

  return Response.json(
    {
      ...result,
      tags: result?.tags.map((st) => st.tag) ?? [],
      date: result?.date.toISOString(),
      createdAt: result?.createdAt.toISOString(),
    },
    { status: 201 }
  )
}
