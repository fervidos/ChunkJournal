import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { generateThumbnailS3Key } from '@/lib/s3'
import sharp from 'sharp'

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

// Panorama textures are loaded as WebGL textures, and browsers refuse to
// decode images larger than their max texture size (~16384px). Equirectangular
// uploads can easily exceed that, so downscale on the fly for the preview.
const PREVIEW_MAX_WIDTH = 4096
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

async function s3BodyToBuffer(body: unknown): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of body as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

// Resize an S3 object's image payload to a max width and re-encode as webp.
async function resizedWebp(body: unknown, maxWidth: number): Promise<Buffer> {
  const bytes = await s3BodyToBuffer(body)
  return sharp(bytes, { limitInputPixels: false })
    .resize(maxWidth, undefined, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const isThumb = req.nextUrl.searchParams.get('thumb') === '1'
  const isPreview = req.nextUrl.searchParams.get('preview') === '1'
  const widthParam = req.nextUrl.searchParams.get('width')

  const screenshot = await prisma.screenshot.findUnique({
    where: { id },
    select: { s3Key: true, mimeType: true, width: true },
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

  // Downscale oversized originals so browsers can decode them and mobile users
  // don't download multi-hundred-MP files. `preview` is a hard cap; `width`
  // lets callers request a specific max width (whichever is smaller wins).
  let targetWidth = isPreview ? PREVIEW_MAX_WIDTH : 0
  if (widthParam) {
    const w = Number.parseInt(widthParam, 10)
    if (Number.isFinite(w) && w > 0) {
      targetWidth = targetWidth ? Math.min(targetWidth, w) : Math.min(w, PREVIEW_MAX_WIDTH)
    }
  }

  if (targetWidth && screenshot.width && screenshot.width > targetWidth) {
    let webp: Buffer | null = null
    try {
      webp = await resizedWebp(result.Body, targetWidth)
    } catch {
      // fall through to streaming the original
    }
    if (webp) {
      return new Response(new Uint8Array(webp), {
        headers: { 'Content-Type': 'image/webp', 'Cache-Control': IMMUTABLE_CACHE },
      })
    }
    // The original body was consumed above — refetch so we can stream it.
    result = await tryFetch(screenshot.s3Key)
    if (!result) {
      return new Response('Not found', { status: 404 })
    }
  }

  const stream = result.Body as ReadableStream | null
  if (!stream) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': IMMUTABLE_CACHE,
    },
  })
}
