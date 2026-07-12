import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { generateThumbnailS3Key } from '@/lib/s3'

const s3 = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
})

async function tryFetch(key: string) {
  try {
    return await s3.send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key })
    )
  } catch {
    return null
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const isThumb = req.nextUrl.searchParams.get('thumb') === '1'

  const screenshot = await prisma.screenshot.findUnique({
    where: { id },
    select: { s3Key: true, mimeType: true },
  })
  if (!screenshot) {
    return new Response('Not found', { status: 404 })
  }

  let result: Awaited<ReturnType<typeof tryFetch>> | null = null
  let contentType = screenshot.mimeType

  if (isThumb) {
    const thumbKey = generateThumbnailS3Key(screenshot.s3Key)
    result = await tryFetch(thumbKey)
    if (result) contentType = 'image/webp'
  }

  if (!result) {
    result = await tryFetch(screenshot.s3Key)
  }

  if (!result) {
    return new Response('Not found', { status: 404 })
  }

  const stream = result.Body as ReadableStream | null
  if (!stream) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
