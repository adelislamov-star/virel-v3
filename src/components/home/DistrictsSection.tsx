import Link from 'next/link'

const DISTRICTS = [
  { n: '01', name: 'Mayfair', post: 'W1K \u00b7 W1J', slug: 'mayfair' },
  { n: '02', name: 'Knightsbridge', post: 'SW1X', slug: 'knightsbridge' },
  { n: '03', name: 'Chelsea', post: 'SW3 \u00b7 SW10', slug: 'chelsea' },
  { n: '04', name: 'Kensington', post: 'W8 \u00b7 W14', slug: 'kensington' },
  { n: '05', name: 'Belgravia', post: 'SW1W', slug: 'belgravia' },
  { n: '06', name: 'Notting Hill', post: 'W11', slug: 'notting-hill' },
  { n: '07', name: 'Marylebone', post: 'W1U', slug: 'marylebone' },
  { n: '08', name: 'Soho', post: 'W1D', slug: 'soho' },
  { n: '09', name: 'Sloane Square', post: 'SW1W', slug: 'sloane-square' },
  { n: '10', name: 'South Kensington', post: 'SW7', slug: 'south-kensington' },
]

export function DistrictsSection() {
  return (
    <section className="districts-section">
      <p className="sec-eyebrow">Locations</p>
      <h2 className="sec-h2" style={{ marginBottom: 0 }}>
        Available across <em>London&apos;s finest</em>
      </h2>
      <div className="districts-grid">
        {DISTRICTS.map((d) => (
          <Link key={d.slug} href={`/london/${d.slug}-escorts`} className="district">
            <span className="district-n">{d.n}</span>
            <span className="district-name">{d.name}</span>
            <span className="district-post">{d.post}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
