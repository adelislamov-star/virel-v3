import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Virel — Premium London Escorts'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#080808',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Border frame */}
        <div style={{
          position: 'absolute',
          inset: 32,
          border: '1px solid rgba(201,168,76,0.25)',
          display: 'flex',
        }} />
        {/* Corner accents */}
        <div style={{ position: 'absolute', top: 52, left: 52, width: 24, height: 1, background: '#c9a84c', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 52, left: 52, width: 1, height: 24, background: '#c9a84c', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 52, right: 52, width: 24, height: 1, background: '#c9a84c', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 52, right: 52, width: 1, height: 24, background: '#c9a84c', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 52, left: 52, width: 24, height: 1, background: '#c9a84c', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 52, left: 52, width: 1, height: 24, background: '#c9a84c', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 52, right: 52, width: 24, height: 1, background: '#c9a84c', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 52, right: 52, width: 1, height: 24, background: '#c9a84c', display: 'flex' }} />

        {/* Content */}
        <p style={{ fontSize: 13, letterSpacing: '0.3em', color: '#c9a84c', textTransform: 'uppercase', margin: '0 0 24px', display: 'flex' }}>
          London Escort Agency
        </p>
        <h1 style={{ fontSize: 96, fontWeight: 300, color: '#f0e8dc', margin: '0 0 20px', letterSpacing: '0.06em', display: 'flex' }}>
          Virel
        </h1>
        <div style={{ width: 60, height: 1, background: 'rgba(201,168,76,0.4)', margin: '0 0 24px', display: 'flex' }} />
        <p style={{ fontSize: 20, color: '#6b6560', fontWeight: 300, letterSpacing: '0.08em', margin: 0, display: 'flex' }}>
          Premium Companion Services in London
        </p>
      </div>
    ),
    { ...size }
  )
}
