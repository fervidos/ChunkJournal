import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
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
            position: 'absolute',
            bottom: '-120px',
            left: '-120px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: '#7BBC5E',
            opacity: 0.04,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: '#7BBC5E',
            opacity: 0.04,
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: '88px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#e8e6e3',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: 1,
            }}
          >
            <span style={{ color: '#7BBC5E' }}>Chunk</span>Journal
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#888',
              textAlign: 'center',
              maxWidth: '600px',
              lineHeight: 1.5,
              fontWeight: 400,
              fontFamily: 'system-ui, -apple-system, sans-serif',
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
              color: '#555',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: '32px', height: '1px', background: '#2a2a2a' }} />
            Chunk by Chunk
            <span style={{ width: '32px', height: '1px', background: '#2a2a2a' }} />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
