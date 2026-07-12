export interface ScreenshotData {
  id: string
  title: string | null
  description: string | null
  date: string
  filename: string
  width: number | null
  height: number | null
  fileSize: number | null
  mimeType: string
  s3Key: string
  thumbnailS3Key: string | null
  worldId: string | null
  world: { id: string; name: string; slug: string } | null
  tags: { id: string; name: string }[]
  createdAt: string
}

export interface WorldData {
  id: string
  name: string
  slug: string
  _count?: { screenshots: number }
}
