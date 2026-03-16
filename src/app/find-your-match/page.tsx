// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const questions = [
  {
    id: 'experience',
    text: 'What kind of experience are you looking for?',
    options: [
      { value: 'gfe', label: 'Romantic Connection', desc: 'GFE, dinner dates, travel' },
      { value: 'intimate', label: 'Sensual Adventure', desc: 'PSE, intimate, open-minded' },
      { value: 'wellness', label: 'Relaxation & Wellness', desc: 'Massage, tantric, body to body' },
      { value: 'fetish', label: 'Fetish & Fantasy', desc: 'BDSM, domination, roleplay' },
    ],
  },
  {
    id: 'appearance',
    text: 'Do you have an appearance preference?',
    options: [
      { value: 'blonde', label: 'Blonde' },
      { value: 'brunette', label: 'Brunette' },
      { value: 'redhead', label: 'Redhead' },
      { value: 'dark', label: 'Dark Hair' },
      { value: 'any', label: 'No Preference' },
    ],
  },
  {
    id: 'district',
    text: 'Where would you like to meet?',
    type: 'select',
  },
  {
    id: 'duration',
    text: 'How long would you like to spend together?',
    options: [
      { value: 60, label: '1 Hour' },
      { value: 120, label: '2 Hours' },
      { value: 180, label: '3 Hours' },
      { value: 540, label: 'Overnight' },
    ],
  },
  {
    id: 'budget',
    text: 'What is your budget per hour?',
    options: [
      { value: 400, label: 'Under £400' },
      { value: 700, label: '£400 – £700' },
      { value: 1200, label: '£700 – £1,200' },
      { value: 9999, label: '£1,200+' },
    ],
  },
]

export default function FindYourMatchPage() {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[] | null>(null)
  const [districts, setDistricts] = useState<any[]>([])
  const [fade, setFade] = useState(true)

  useEffect(() => {
    fetch('/api/public/districts')
      .then(r => r.json())
      .then(data => setDistricts(data.data || []))
  }, [])

  const selectOption = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    if (currentQ < questions.length - 1) {
      setFade(false)
      setTimeout(() => {
        setCurrentQ(prev => prev + 1)
        setFade(true)
      }, 200)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/public/smart-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience: answers.experience,
          appearance: answers.appearance,
          district: answers.district ?? 'any',
          duration: answers.duration,
          budget: answers.budget,
        }),
      })
      const data = await res.json()
      setResults(data.data || [])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const resetQuiz = () => {
    setCurrentQ(0)
    setAnswers({})
    setResults(null)
    setFade(true)
  }

  const q = questions[currentQ]
  const progress = ((currentQ + 1) / questions.length) * 100

  return (
    <main style={rootStyle}>
      <style>{fontImport}{`
        .match-opt { padding:24px 28px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); cursor:pointer; transition:all .25s; text-align:left; font-family:inherit; color:#ddd5c8; width:100%; }
        .match-opt:hover { border-color:rgba(197,165,114,0.4); background:rgba(197,165,114,0.05); }
        .match-card { border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); overflow:hidden; }
        .match-link { display:inline-block; padding:10px 24px; font-size:11px; letter-spacing:.15em; text-transform:uppercase; text-decoration:none; transition:all .2s; font-family:inherit; }
      `}</style>
      <Header />

      <section style={{ maxWidth: 680, margin: '0 auto', padding: '96px 24px 80px' }}>
        <p style={{ fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: '#C5A572', marginBottom: 24, textAlign: 'center' }}>
          Smart Match
        </p>
        <h1 style={{ fontFamily: serif, fontSize: 'clamp(36px,5vw,56px)', fontWeight: 300, color: '#f0e8dc', margin: '0 0 48px', textAlign: 'center' }}>
          Find Your Perfect Match
        </h1>

        {/* Quiz */}
        {results === null && !isLoading && (
          <>
            {/* Progress bar */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#6b6560' }}>Question {currentQ + 1} of {questions.length}</span>
                <span style={{ fontSize: 12, color: '#6b6560' }}>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#C5A572', transition: 'width .3s' }} />
              </div>
            </div>

            {/* Question */}
            <div style={{ opacity: fade ? 1 : 0, transition: 'opacity .2s' }}>
              <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 32px', textAlign: 'center' }}>
                {q.text}
              </h2>

              {q.type === 'select' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <select
                    style={{
                      width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)', color: '#f0e8dc', fontSize: 14,
                      fontFamily: 'inherit', appearance: 'auto',
                    }}
                    value={answers.district || ''}
                    onChange={e => selectOption('district', e.target.value)}
                  >
                    <option value="">Select a district...</option>
                    {districts.map((d: any) => (
                      <option key={d.id} value={d.slug}>{d.name}</option>
                    ))}
                  </select>
                  <button className="match-opt" onClick={() => selectOption('district', 'any')}
                    style={{ textAlign: 'center', color: '#C5A572', borderColor: 'rgba(197,165,114,0.3)' }}>
                    I&apos;m flexible
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {q.options?.map(opt => (
                    <button key={opt.value} className="match-opt" onClick={() => selectOption(q.id, opt.value)}
                      style={{
                        borderColor: answers[q.id] === opt.value ? 'rgba(197,165,114,0.5)' : undefined,
                        background: answers[q.id] === opt.value ? 'rgba(197,165,114,0.08)' : undefined,
                      }}>
                      <span style={{ fontSize: 15, fontWeight: 400 }}>{opt.label}</span>
                      {opt.desc && <span style={{ display: 'block', fontSize: 12, color: '#6b6560', marginTop: 4 }}>{opt.desc}</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Submit on last question */}
              {currentQ === questions.length - 1 && answers[q.id] !== undefined && (
                <button onClick={handleSubmit} style={{
                  width: '100%', marginTop: 24, padding: '16px', background: '#C5A572', border: 'none',
                  color: '#0A0A0A', fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                }}>
                  Find My Match
                </button>
              )}
            </div>
          </>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>&#128270;</div>
            <p style={{ fontSize: 15, color: '#6b6560' }}>Finding your perfect match...</p>
          </div>
        )}

        {/* Results */}
        {results !== null && !isLoading && (
          <div>
            {results.length > 0 ? (
              <>
                <h2 style={{ fontFamily: serif, fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: '0 0 32px', textAlign: 'center' }}>
                  Your Perfect Matches
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {results.map((r: any) => {
                    const m = r.model
                    const coverUrl = m.coverPhotoUrl || m.media?.[0]?.url
                    return (
                      <div key={m.id} className="match-card" style={{ display: 'flex', gap: 0 }}>
                        {/* Photo */}
                        <div style={{ width: 200, minHeight: 260, position: 'relative', flexShrink: 0, background: '#151515' }}>
                          {coverUrl ? (
                            <Image src={coverUrl} alt={m.name} fill style={{ objectFit: 'cover' }} sizes="200px" />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#3a3530' }}>
                              {m.name?.[0]}
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <h3 style={{ fontFamily: serif, fontSize: 24, fontWeight: 300, color: '#f0e8dc', margin: 0 }}>{m.name}</h3>
                          {m.tagline && <p style={{ fontSize: 13, color: '#6b6560', margin: 0 }}>{m.tagline}</p>}
                          {r.reason && <p style={{ fontSize: 13, color: '#8a8580', margin: 0, lineHeight: 1.7, fontStyle: 'italic' }}>{r.reason}</p>}
                          <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                            <Link href={`/companions/${m.slug}`} className="match-link"
                              style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#ddd5c8' }}>
                              View Profile
                            </Link>
                            <Link href={`/book?modelSlug=${m.slug}`} className="match-link"
                              style={{ background: '#C5A572', color: '#0A0A0A' }}>
                              Book Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>
                  No exact matches found
                </h2>
                <p style={{ fontSize: 14, color: '#6b6560', margin: '0 0 32px' }}>
                  Try adjusting your preferences or browse our full catalogue.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 40 }}>
              <button onClick={resetQuiz} className="match-link"
                style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#ddd5c8', cursor: 'pointer', background: 'none' }}>
                Refine Search
              </button>
              <Link href="/companions" className="match-link"
                style={{ border: '1px solid rgba(197,165,114,0.4)', color: '#C5A572' }}>
                Browse All Companions
              </Link>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}

const serif = 'Cormorant Garamond, serif'
const rootStyle: React.CSSProperties = { background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }
const fontImport = ''
