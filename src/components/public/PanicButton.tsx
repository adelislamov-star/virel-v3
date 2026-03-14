'use client'

export function PanicButton() {
  return (
    <button
      onClick={() => window.location.replace('https://www.bbc.co.uk')}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 14,
        color: '#4a4540',
        padding: '4px 8px',
        transition: 'color 0.2s',
        lineHeight: 1,
      }}
      title="Exit"
      aria-label="Quick exit"
      onMouseOver={(e) => (e.currentTarget.style.color = '#808080')}
      onMouseOut={(e) => (e.currentTarget.style.color = '#4a4540')}
    >
      ✕
    </button>
  )
}
