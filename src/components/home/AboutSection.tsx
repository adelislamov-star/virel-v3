import Image from 'next/image'

interface AboutSectionProps {
  photoUrl: string | null
}

export function AboutSection({ photoUrl }: AboutSectionProps) {
  return (
    <section className="section">
      <div className="home-about-grid">
        <div>
          <p className="sec-eyebrow">About Vaurel</p>
          <h2 className="sec-h2" style={{ marginBottom: 20 }}>
            Arranged with<br /><em>care and discretion</em>
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.95, color: 'rgba(248,244,238,0.52)', marginBottom: 14 }}>
            Vaurel is a private companion agency based in London. We work with a carefully selected group of companions — each personally met, verified, and introduced by our team.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.95, color: 'rgba(248,244,238,0.36)', marginBottom: 14 }}>
            Every arrangement is handled with complete professionalism and absolute discretion. We do not operate as a directory — our companions are exclusive to Vaurel, and every introduction is arranged personally by a member of our team.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.95, color: 'rgba(248,244,238,0.28)', marginBottom: 0 }}>
            We cover all areas of London, including Mayfair, Knightsbridge, Chelsea, Kensington, Belgravia and the City. Whether you require an in-call appointment or an outcall to your hotel, we will accommodate your requirements with the same level of care.
          </p>
          <div className="about-pillars">
            <div className="ap">
              <div className="ap-line" />
              <div>
                <div className="ap-title">Personally verified</div>
                <div className="ap-text">Every companion is met in person. Identity confirmed, photos authentic.</div>
              </div>
            </div>
            <div className="ap">
              <div className="ap-line" />
              <div>
                <div className="ap-title">Complete discretion</div>
                <div className="ap-text">All communications and arrangements remain entirely private. Always.</div>
              </div>
            </div>
            <div className="ap">
              <div className="ap-line" />
              <div>
                <div className="ap-title">Personal response</div>
                <div className="ap-text">Our team responds to every enquiry personally. No automated replies, ever.</div>
              </div>
            </div>
          </div>
        </div>
        <div className="home-about-img">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt="Vaurel companion agency London"
              width={600}
              height={520}
              style={{ objectFit: 'cover', objectPosition: 'center 15%', width: '100%', height: 520 }}
              sizes="(max-width: 1100px) 100vw, 50vw"
            />
          ) : (
            <div style={{ width: '100%', height: 520, background: '#161410' }} />
          )}
        </div>
      </div>
    </section>
  )
}
