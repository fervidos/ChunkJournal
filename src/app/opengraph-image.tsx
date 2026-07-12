import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'
import { getSignedDownloadUrl } from '@/lib/s3'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const count = await prisma.screenshot.count()
  let imageUrl: string | null = null

  if (count > 0) {
    const skip = Math.floor(Math.random() * count)
    const [screenshot] = await prisma.screenshot.findMany({
      take: 1,
      skip,
      select: { s3Key: true },
    })
    if (screenshot) {
      imageUrl = await getSignedDownloadUrl(screenshot.s3Key)
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#7BBC5E',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '88px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#e8e6e3',
              lineHeight: 1,
              textShadow: '0 2px 24px rgba(0,0,0,0.5)',
            }}
          >
            <span style={{ color: '#7BBC5E' }}>Chunk</span>
            <span>Journal</span>
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#ccc',
              textAlign: 'center',
              maxWidth: '600px',
              lineHeight: 1.5,
              fontWeight: 400,
              textShadow: '0 1px 12px rgba(0,0,0,0.5)',
            }}
          >
            A collection of the worlds I&apos;ve explored, the places I&apos;ve built, and the memories I&apos;ve made.
          </div>
          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#999',
              letterSpacing: '0.15em',
            }}
          >
            <span style={{ width: '32px', height: '1px', background: '#555' }} />
            CHUNK BY CHUNK
            <span style={{ width: '32px', height: '1px', background: '#555' }} />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
