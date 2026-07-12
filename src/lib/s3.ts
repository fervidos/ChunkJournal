import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
})

const bucket = process.env.S3_BUCKET!

export async function uploadFile(key: string, buffer: Buffer, mimeType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  )
}

export async function deleteFile(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )
}

export async function getSignedDownloadUrl(key: string) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 3600 }
  )
}

export function generateS3Key(userId: string, filename: string) {
  const ext = filename.split('.').pop() || 'png'
  return `uploads/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
}

export function generateThumbnailS3Key(s3Key: string) {
  const base = s3Key.replace(/\.[^.]+$/, '')
  return `${base}.thumb.webp`
}
