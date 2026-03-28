# ТЗ для Claude Code: Редизайн страницы профиля `/companions/[slug]`
## Проект: Vaurel / Virel v3

---

## КОНТЕКСТ

Репозиторий: `C:\Virel` (локально) / `github.com/adelislamov-star/virel-v3`
Продакшн: `vaurel.co.uk` → Vercel автодеплой из `main`
Стек: Next.js App Router, TypeScript strict, Prisma, PostgreSQL (Neon EU), Tailwind + custom CSS

---

## ЗАДАЧА

Полностью заменить страницу профиля компаньона `/companions/[slug]` на новый премиальный дизайн.
Эталон дизайна: файл `vaurel-profile-inciona_4.html` (приложен к задаче).

---

## ВАЖНЫЕ ОГРАНИЧЕНИЯ

1. **TypeScript strict включён** — `tsc --noEmit` должен проходить без ошибок
2. **`export const revalidate = 60`** — сохранить обязательно
3. **SEO не трогать** — `generateMetadata()`, `generateStaticParams()`, Schema.org JSON-LD, canonical
4. **`<ViewTracker>`** — оставить
5. **SEO ссылки** (districts, categories) в конце страницы — оставить
6. **`companions/page.tsx`** (список компаньонов) — не трогать
7. **Каталожные стили** в `companions.css` (`.catalog-*`, `.card-*`, `.sidebar`, `.results-*`) — не трогать
8. **Глобальный `<Navbar>`** уже есть в `layout.tsx` — не дублировать
9. **`<FloatingContacts>`** уже есть глобально — не дублировать в профиле
10. **`next.config.js`**, **`prisma/schema.prisma`** — не трогать

---

## ФАЙЛЫ ДЛЯ ИЗМЕНЕНИЯ

| Файл | Действие |
|---|---|
| `src/app/companions/[slug]/page.tsx` | Полная замена JSX + расширить `getProfileData()` |
| `src/app/companions/companions.css` | Добавить секцию профиля в конец |
| `src/styles/globals.css` | Удалить строки 410–452 (старые стили профиля) |
| `src/components/public/ProfileStickyBar.tsx` | Создать новый компонент |

**`BookingWidget.tsx`** — убрать импорт из `page.tsx`, сам файл не трогать.

---

## ШАГ 1: Расширить `getProfileData()` в `page.tsx`

Добавить в `prisma.model.findUnique` select:

```typescript
wardrobe: true,
publicTags: true,
travel: true,
ethnicity: true,
paymentCash: true,
paymentRevolut: true,
paymentBankTransfer: true,
paymentBTC: true,
paymentUSDT: true,
paymentTerminal: true,
paymentMonzo: true,
paymentStarling: true,
paymentMonese: true,
paymentLTC: true,
```

Добавить в возвращаемый объект профиля:

```typescript
wardrobe: model.wardrobe,           // string[]
publicTags: model.publicTags,       // string[]
travel: model.travel,               // string | null
ethnicity: model.ethnicity,         // string | null
paymentMethods: [
  model.paymentCash && 'Cash',
  model.paymentTerminal && 'Card Terminal',
  model.paymentBankTransfer && 'Bank Transfer',
  model.paymentMonzo && 'Monzo',
  model.paymentRevolut && 'Revolut',
  model.paymentStarling && 'Starling',
  model.paymentLTC && 'LTC',
  model.paymentBTC && 'Bitcoin',
  model.paymentUSDT && 'USDT',
].filter(Boolean) as string[],
```

---

## ШАГ 2: Создать `src/components/public/ProfileStickyBar.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'

interface ProfileStickyBarProps {
  name: string
  lowestPrice: number | null
  availability: string | null
  waUrl: string
  tgUrl: string
  onLeaveRequest: () => void
}

export function ProfileStickyBar({
  name, lowestPrice, availability, waUrl, tgUrl, onLeaveRequest
}: ProfileStickyBarProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const threshold = window.innerHeight * 0.55
    const fn = () => setVisible(window.scrollY > threshold)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const isAvailable = availability === 'Available Now'

  return (
    <div className={`psb-bar${visible ? ' psb-show' : ''}`}>
      <div className="psb-info">
        <span className="psb-name">{name}</span>
        {lowestPrice && (
          <span className="psb-price">From £{lowestPrice.toLocaleString('en-GB')} / hr</span>
        )}
        {isAvailable && (
          <>
            <span className="psb-sep" />
            <span className="psb-avail">
              <span className="psb-dot" />
              Available now
            </span>
          </>
        )}
      </div>
      <div className="psb-btns">
        <button className="psb-form-btn" onClick={onLeaveRequest}>
          Leave a request
        </button>
        <a href={tgUrl} target="_blank" rel="noopener noreferrer" className="psb-tg">
          Telegram
        </a>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="psb-wa">
          WhatsApp
        </a>
      </div>
    </div>
  )
}
```

---

## ШАГ 3: Заменить JSX в `page.tsx`

### Импорты — заменить:

```typescript
// @ts-nocheck  ← УБРАТЬ эту строку
export const revalidate = 60

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { CompanionGallery } from '@/components/public/CompanionGallery'
import { ProfileStickyBar } from '@/components/public/ProfileStickyBar'
import { ProfileEnquiryForm } from '@/components/public/ProfileEnquiryForm'
import { ViewTracker } from '@/components/public/ViewTracker'
import { ModelCard } from '@/components/public/ModelCard'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'
import '@/app/companions/companions.css'
```

**`BookingWidget`** импорт убрать полностью.

### Константы WA/TG (хардкод — env переменных нет):

```typescript
const WA_NUMBER = '447562279678'
const TG_HANDLE = '+447562279678'
```

### Функция построения ссылок:

```typescript
function buildWaUrl(name: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `Hi, I'm interested in arranging a meeting with ${name}. Could you help me?`
  )}`
}

function buildTgUrl() {
  return `https://t.me/${TG_HANDLE}`
}
```

### JSX страницы — 10 блоков:

```tsx
export default async function ModelProfilePage({ params }: Props) {
  const profile = await getProfileData(params.slug)
  if (!profile) notFound()

  let similarModels: any[] = []
  try {
    similarModels = await prisma.model.findMany({
      where: { status: 'active', deletedAt: null, id: { not: profile.id } },
      include: {
        media: { where: { isPrimary: true, isPublic: true }, take: 1 },
        modelRates: { include: { callRateMaster: true }, take: 1 },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    })
  } catch {}

  const regularServices = profile.services.filter((s: any) => !s.isExtra)
  const extraServices = profile.services.filter((s: any) => s.isExtra && s.extraPrice != null)

  // Group services by category
  const serviceGroups: Record<string, typeof regularServices> = {}
  for (const svc of regularServices) {
    const cat = svc.category || 'Other'
    if (!serviceGroups[cat]) serviceGroups[cat] = []
    serviceGroups[cat].push(svc)
  }
  const categoryOrder = ['signature', 'wellness', 'fetish', 'Other']
  const categoryLabels: Record<string, string> = {
    signature: 'Signature',
    wellness: 'Wellness',
    fetish: 'Fetish & Duo',
    Other: 'Services',
  }

  const waUrl = buildWaUrl(profile.name)
  const tgUrl = buildTgUrl()
  const isAvailable = profile.availability === 'Available Now'

  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: `${BASE_URL}/companions/${profile.slug}`,
    image: profile.primaryPhoto ?? undefined,
  }

  return (
    <div className="pr-root">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
      />
      <ViewTracker slug={params.slug} />

      {/* ══ 1. HERO ══ */}
      <div className="pr-hero">
        {/* Gallery — левая панель */}
        <div className="pr-gallery">
          <CompanionGallery
            coverPhotoUrl={profile.primaryPhoto}
            galleryPhotoUrls={profile.galleryUrls}
            name={profile.name}
          />
        </div>

        {/* Info — правая панель */}
        <div className="pr-hinfo">
          {isAvailable && (
            <div className="pr-avail">
              <span className="pr-avail-dot" />
              <span className="pr-avail-text">Available now · {profile.primaryDistrict ?? 'London'}</span>
            </div>
          )}
          <h1 className="pr-name">
            {profile.name}<em>.</em>
          </h1>
          {profile.tagline && (
            <p className="pr-tagline">{profile.tagline}</p>
          )}
          {profile.lowestPrice && (
            <div className="pr-price-anchor">
              <div className="pr-price-from">From</div>
              <div className="pr-price-val">
                £{profile.lowestPrice.toLocaleString('en-GB')}
                <span>/ hour</span>
              </div>
            </div>
          )}
          <div className="pr-btns">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="pr-btn-wa">
              WhatsApp
            </a>
            <a href={tgUrl} target="_blank" rel="noopener noreferrer" className="pr-btn-tg">
              Telegram
            </a>
          </div>
          <p className="pr-response">Our team responds within 15 minutes · 24/7</p>
        </div>
      </div>

      {/* ══ 2. PRESENCE ══ */}
      {profile.bio && (
        <>
          <hr className="pr-div" />
          <div className="pr-presence">
            <div>
              <div className="pr-label">About {profile.name.trim()}</div>
              <h2 className="pr-sec-title">
                A presence<br /><em>you won&apos;t forget.</em>
              </h2>
              <p className="pr-bio">{profile.bio}</p>
              {profile.publicTags.length > 0 && (
                <p className="pr-curated">
                  {profile.publicTags.join(' · ')}
                </p>
              )}
            </div>
            <div className="pr-presence-right">
              <p className="pr-presence-quote">
                &ldquo;The kind of presence that makes the rest of the city disappear.&rdquo;
              </p>
            </div>
          </div>
        </>
      )}

      {/* ══ 3. TRUST ══ */}
      <div className="pr-trust-section">
        <div className="pr-trust-inner">
          <div className="pr-trust-item">
            <div className="pr-trust-mark">✓ Verified</div>
            <div className="pr-trust-title">Personally met</div>
            <div className="pr-trust-desc">Identity confirmed in person by our team.</div>
          </div>
          <div className="pr-trust-item">
            <div className="pr-trust-mark">◎ Authentic</div>
            <div className="pr-trust-title">Genuine photos</div>
            <div className="pr-trust-desc">What you see is exactly who you meet.</div>
          </div>
          {profile.isExclusive && (
            <div className="pr-trust-item">
              <div className="pr-trust-mark">◈ Exclusive</div>
              <div className="pr-trust-title">Only at Vaurel</div>
              <div className="pr-trust-desc">Not listed elsewhere. Introductions through us only.</div>
            </div>
          )}
          <div className="pr-trust-item">
            <div className="pr-trust-mark">◷ Responsive</div>
            <div className="pr-trust-title">15-min reply</div>
            <div className="pr-trust-desc">Our team responds personally, around the clock.</div>
          </div>
        </div>
      </div>

      {/* ══ 4. RATES ══ */}
      {profile.rates.length > 0 && (
        <>
          <hr className="pr-div" />
          <div className="pr-section">
            <div className="pr-label">Arrangements</div>
            <h2 className="pr-sec-title">Time &amp; <em>rates</em></h2>

            {profile.lowestPrice && (
              <div className="pr-rates-anchor">
                <div className="pr-rates-from">From</div>
                <div className="pr-rates-val">
                  £{profile.lowestPrice.toLocaleString('en-GB')}
                  <span>/ hour</span>
                </div>
                <div className="pr-rates-sub">Private arrangements in London and beyond.</div>
              </div>
            )}

            <table className="pr-rates-table">
              <thead>
                <tr>
                  <th>Duration</th>
                  <th>Incall</th>
                  <th>Outcall</th>
                </tr>
              </thead>
              <tbody>
                {profile.rates.map((row: any) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.incall != null ? `£${Number(row.incall).toLocaleString('en-GB')}` : '—'}</td>
                    <td>{row.outcall != null ? `£${Number(row.outcall).toLocaleString('en-GB')}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {extraServices.length > 0 && (
              <div className="pr-extras-row">
                <span className="pr-extras-lbl">Extras</span>
                {extraServices.map((svc: any) => (
                  <div key={svc.serviceId} className="pr-extra-item">
                    <span className="pr-extra-name">{svc.name}</span>
                    <span className="pr-extra-price">+£{svc.extraPrice}</span>
                  </div>
                ))}
              </div>
            )}

            {profile.paymentMethods.length > 0 && (
              <div className="pr-pay-row">
                <span className="pr-pay-lbl">Payment</span>
                <div className="pr-pay-methods">
                  {profile.paymentMethods.map((m: string) => (
                    <span key={m} className="pr-pay-item">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ 5. ENQUIRE + FORM ══ */}
      <div className="pr-enquire-section" id="pr-enquire">
        <div className="pr-enq-top">
          <div className="pr-label pr-label-center">Private enquiry</div>
          <h2 className="pr-enq-title">
            Arrange a<br /><em>private meeting.</em>
          </h2>
          <p className="pr-enq-sub">Our team responds within 15 minutes · 24/7</p>
          <div className="pr-enq-btns">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="pr-btn-wa">
              Arrange via WhatsApp
            </a>
            <a href={tgUrl} target="_blank" rel="noopener noreferrer" className="pr-btn-tg">
              Arrange via Telegram
            </a>
          </div>
          <p className="pr-enq-note">All enquiries handled with complete discretion.</p>
        </div>
        <div className="pr-form-wrap">
          <ProfileEnquiryForm
            companionName={profile.name}
            rates={profile.rates}
          />
        </div>
      </div>

      {/* ══ 6. DETAILS ══ */}
      {profile.stats && (
        <>
          <hr className="pr-div" />
          <div className="pr-section">
            <div className="pr-label">Profile</div>
            <div className="pr-details-grid">
              <div className="pr-detail-group">
                <div className="pr-detail-t">Physical</div>
                {profile.stats.age && <div className="pr-stat-row"><span>Age</span><span>{profile.stats.age}</span></div>}
                {profile.stats.height && <div className="pr-stat-row"><span>Height</span><span>{profile.stats.height} cm</span></div>}
                {profile.stats.weight && <div className="pr-stat-row"><span>Weight</span><span>{profile.stats.weight} kg</span></div>}
                {profile.stats.bustSize && (
                  <div className="pr-stat-row">
                    <span>Bust</span>
                    <span>{profile.stats.bustSize}{profile.stats.bustType ? ` ${profile.stats.bustType}` : ''}</span>
                  </div>
                )}
                {profile.stats.dressSize && <div className="pr-stat-row"><span>Dress</span><span>{profile.stats.dressSize}</span></div>}
                {profile.stats.eyeColour && <div className="pr-stat-row"><span>Eyes</span><span>{profile.stats.eyeColour}</span></div>}
                {profile.stats.hairColour && <div className="pr-stat-row"><span>Hair</span><span>{profile.stats.hairColour}</span></div>}
                {profile.stats.tattooStatus && <div className="pr-stat-row"><span>Tattoos</span><span>{profile.stats.tattooStatus}</span></div>}
              </div>
              <div className="pr-detail-group">
                <div className="pr-detail-t">Background</div>
                {profile.stats.nationality && <div className="pr-stat-row"><span>Nationality</span><span>{profile.stats.nationality}</span></div>}
                {profile.ethnicity && <div className="pr-stat-row"><span>Ethnicity</span><span>{profile.ethnicity}</span></div>}
                {profile.stats.orientation && <div className="pr-stat-row"><span>Orientation</span><span>{profile.stats.orientation}</span></div>}
                {profile.stats.smokingStatus && <div className="pr-stat-row"><span>Smoking</span><span>{profile.stats.smokingStatus}</span></div>}
              </div>
              <div className="pr-detail-group">
                <div className="pr-detail-t">Location & Travel</div>
                {profile.districts.length > 0 && (
                  <div className="pr-stat-row"><span>Based</span><span>{profile.districts.map((d: any) => d.name).join(' · ')}</span></div>
                )}
                {profile.nearestStation && <div className="pr-stat-row"><span>Station</span><span>{profile.nearestStation}</span></div>}
                {profile.travel && <div className="pr-stat-row"><span>Travel</span><span>{profile.travel}</span></div>}
                {profile.stats.languages?.length > 0 && (
                  <div className="pr-stat-row"><span>Languages</span><span>{profile.stats.languages.join(' · ')}</span></div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ 7. SERVICES ══ */}
      {regularServices.length > 0 && (
        <>
          <hr className="pr-div" />
          <div className="pr-section pr-section-bg">
            <div className="pr-label">Experiences</div>
            <h2 className="pr-sec-title">What she <em>offers</em></h2>
            <p className="pr-svc-intro">
              A refined and open-minded experience, tailored personally to you.
              From relaxed companionship to more adventurous dynamics.
            </p>
            <div className="pr-svc-grid">
              {categoryOrder
                .filter(cat => serviceGroups[cat]?.length > 0)
                .map(cat => (
                  <div key={cat} className="pr-svc-group">
                    <div className="pr-svc-gname">{categoryLabels[cat] || cat}</div>
                    {serviceGroups[cat].map((svc: any) => (
                      <div key={svc.serviceId} className="pr-svc-item">
                        {svc.name}
                      </div>
                    ))}
                  </div>
                ))}
            </div>
            <p className="pr-svc-note">
              All arrangements are for companionship only. Activities between consenting adults are a matter of personal choice.
            </p>
          </div>
        </>
      )}

      {/* ══ 8. WARDROBE ══ */}
      {profile.wardrobe.length > 0 && (
        <>
          <hr className="pr-div" />
          <div className="pr-section">
            <div className="pr-label">Wardrobe</div>
            <h2 className="pr-sec-title">She arrives <em>dressed for you.</em></h2>
            <p className="pr-ward-intro">Every detail can be styled to match the mood of your evening.</p>
            <div className="pr-ward-list">
              {profile.wardrobe.map((item: string) => (
                <span key={item} className="pr-ward-item">{item}</span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══ 9. AVAILABILITY ══ */}
      {profile.availability === 'Available Now' && (
        <>
          <hr className="pr-div" />
          <div className="pr-section pr-section-bg2">
            <div className="pr-label">Availability</div>
            <div className="pr-avail-status">
              <span className="pr-avail-dot pr-avail-dot-lg" />
              <span className="pr-avail-status-text">Available now</span>
            </div>
          </div>
        </>
      )}

      {/* ══ 10. DISCOVER ══ */}
      {similarModels.length > 0 && (
        <>
          <hr className="pr-div" />
          <div className="pr-section">
            <div className="pr-label">Also available</div>
            <h2 className="pr-sec-title">Discover <em>others</em></h2>
            <div className="pr-disc-grid">
              {similarModels.map((sim: any) => {
                const simPhoto = sim.media[0]?.url ?? null
                const simRate = sim.modelRates?.[0]?.incallPrice
                  ? Number(sim.modelRates[0].incallPrice)
                  : null
                return (
                  <ModelCard
                    key={sim.id}
                    name={sim.name}
                    slug={sim.slug}
                    nationality={sim.stats?.nationality ?? null}
                    coverPhotoUrl={simPhoto}
                    availability={sim.availability}
                    isVerified={sim.isVerified}
                    isExclusive={sim.isExclusive}
                    districtName={null}
                    minIncallPrice={simRate}
                  />
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* SEO links — не трогать */}
      {(profile.districts.length > 0 || profile.categories.length > 0) && (
        <div className="profile-seo-links">
          {profile.districts.length > 0 && (
            <div>
              <p>Available in:</p>
              {profile.districts.map((d: any) => (
                <Link key={d.slug} href={`/london/${d.slug}-escorts`}>
                  Escorts in {d.name}
                </Link>
              ))}
            </div>
          )}
          {profile.categories.length > 0 && (
            <div>
              <p>Categories:</p>
              {profile.categories.map((c: any) => (
                <Link key={c.slug} href={`/categories/${c.slug}`}>
                  {c.name} Escorts London
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky Bar */}
      <ProfileStickyBar
        name={profile.name}
        lowestPrice={profile.lowestPrice}
        availability={profile.availability}
        waUrl={waUrl}
        tgUrl={tgUrl}
        onLeaveRequest={() => {
          // handled client-side
        }}
      />
    </div>
  )
}
```

**Важно:** `ProfileStickyBar` и `ProfileEnquiryForm` — client components, их нельзя использовать напрямую в Server Component с `onClick`. Решение: `ProfileStickyBar` сам обрабатывает scroll-to через `useRef` или window scroll, без `onLeaveRequest` пропа. Либо обернуть в отдельный `ProfileClientShell` client component.

---

## ШАГ 4: Создать `src/components/public/ProfileEnquiryForm.tsx`

```tsx
'use client'

import { useState } from 'react'

interface Rate {
  label: string
  incall: number | null
  outcall: number | null
}

interface Props {
  companionName: string
  rates: Rate[]
}

export function ProfileEnquiryForm({ companionName, rates }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: fd.get('name') as string,
      contact: fd.get('contact') as string,
      date: fd.get('date') as string,
      duration: fd.get('duration') as string,
      callType: fd.get('callType') as string,
      message: fd.get('message') as string,
      companion: companionName,
    }
    try {
      const res = await fetch('/api/public/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="pr-form-success">
        <div className="pr-form-success-icon">✓</div>
        <p>Request sent — we will contact you shortly.</p>
      </div>
    )
  }

  return (
    <form className="pr-form-grid" onSubmit={handleSubmit} noValidate>
      <div className="pr-form-half">
        <div className="pr-form-t">Your details</div>
        <div className="pr-f-row">
          <label className="pr-f-label">Name or alias *</label>
          <input name="name" className="pr-f-input" required placeholder="How shall we address you?" />
        </div>
        <div className="pr-f-row">
          <label className="pr-f-label">Contact — WhatsApp / Telegram / Email *</label>
          <input name="contact" className="pr-f-input" required placeholder="How would you like us to reach you?" />
        </div>
        <div className="pr-f-row">
          <label className="pr-f-label">Preferred date</label>
          <input name="date" className="pr-f-input" placeholder="e.g. Friday evening" />
        </div>
        <div className="pr-f-row">
          <label className="pr-f-label">Duration</label>
          <select name="duration" className="pr-f-select">
            <option value="">Select duration</option>
            {rates.map((r) => (
              <option key={r.label} value={r.label}>
                {r.label}{r.incall ? ` — £${r.incall.toLocaleString('en-GB')}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="pr-form-half">
        <div className="pr-form-t">Arrangement details</div>
        <div className="pr-f-row">
          <label className="pr-f-label">Type</label>
          <select name="callType" className="pr-f-select">
            <option value="">Incall or Outcall?</option>
            <option value="incall">Incall</option>
            <option value="outcall">Outcall — your location</option>
          </select>
        </div>
        <div className="pr-f-row">
          <label className="pr-f-label">Special requests or preferences</label>
          <textarea name="message" className="pr-f-textarea" placeholder="Anything you'd like us to know..." />
        </div>
        <button
          type="submit"
          className="pr-f-submit"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Sending…' : 'Send private request'}
        </button>
        {status === 'error' && (
          <p className="pr-f-error">Something went wrong. Please try WhatsApp or Telegram.</p>
        )}
        <p className="pr-f-note">We respond within 15 minutes. All information kept strictly confidential.</p>
      </div>
    </form>
  )
}
```

---

## ШАГ 5: Добавить CSS в `companions.css`

Добавить в самый конец файла новую секцию. CSS берётся **напрямую из файла `vaurel-profile-inciona_4.html`** — скопировать все стили между `<style>` тегами, адаптировать:

1. Убрать глобальные сбросы (`*`, `body`, `html`) — они уже есть
2. Убрать стили `.nav`, `.n-logo` и т.д. — глобальный nav не трогаем
3. Переименовать классы с коротких (`.hero`, `.presence`) на профиксованные (`.pr-hero`, `.pr-presence`) — чтобы не конфликтовать с существующими стилями
4. Добавить стили для новых компонентов: `.psb-bar`, `.pr-form-grid`, `.pr-form-half` и т.д.

**Ключевые CSS переменные** уже определены в companions.css:
```css
--bg: #0C0B09
--gold: #BF9B5A  
--serif: 'Cormorant Garamond', Georgia, serif
--sans: 'DM Sans', 'Helvetica Neue', sans-serif
```

Добавить недостающие переменные в `:root` раздел companions.css:
```css
--bg2: #111009;
--bg3: #19160F;
--gold-l: #D4B678;
--gold-d: rgba(191,155,90,0.12);
--gold-b: rgba(191,155,90,0.22);
--w: #F4EFE6;
--m: rgba(244,239,230,0.48);
--s: rgba(244,239,230,0.10);
```

---

## ШАГ 6: Удалить старые стили профиля из `globals.css`

Удалить строки 410–452 из `src/styles/globals.css`:
```
.profile-root { ... }
.breadcrumb { ... }
.profile-main { ... }
.profile-gallery-col { ... }
.profile-sidebar { ... }
.about-grid { ... }
.about-cell { ... }
.about-lbl { ... }
.about-val { ... }
.loc-block { ... }
.loc-main { ... }
.loc-station { ... }
.svc-tags { ... }
.svc-tag { ... }
.rates-table { ... }
.similar-section { ... }
.similar-grid { ... }
.content-sections { ... }
```

---

## ШАГ 7: Решить проблему Server/Client компонентов

`page.tsx` — Server Component. `ProfileStickyBar` и `ProfileEnquiryForm` — Client Components.

**Проблема:** `onLeaveRequest` пропс нельзя передать из Server Component в Client Component (функция не сериализуется).

**Решение:** `ProfileStickyBar` сам обрабатывает scroll-to-form через `useEffect`:

```tsx
// Внутри ProfileStickyBar — кнопка сама скроллит
<button
  className="psb-form-btn"
  onClick={() => {
    document.getElementById('pr-enquire')?.scrollIntoView({ behavior: 'smooth' })
  }}
>
  Leave a request
</button>
```

Убрать `onLeaveRequest` проп полностью.

---

## ШАГ 8: Проверка TypeScript

```bash
cd C:\Virel
npx tsc --noEmit
```

Если ошибки — исправить все до нуля. Особое внимание:
- `profile.wardrobe` — тип `string[]`
- `profile.paymentMethods` — тип `string[]`
- `profile.ethnicity` — тип `string | null`
- `profile.travel` — тип `string | null`
- `ModelCard` пропсы — проверить что `nationality` (не `tagline`) передаётся

---

## ШАГ 9: Git commit + push

```bash
cd C:\Virel
git add src/app/companions/companions.css
git add src/styles/globals.css
git add src/app/companions/[slug]/page.tsx
git add src/components/public/ProfileStickyBar.tsx
git add src/components/public/ProfileEnquiryForm.tsx
git commit -m "feat: profile page redesign — 10-block premium layout"
git push
```

Vercel автодеплоит из `main`. Проверить что деплой READY.

---

## КРИТЕРИИ ГОТОВНОСТИ

- [ ] `/companions/giorgina-vegas` открывается без ошибок
- [ ] `/companions/marsalina` открывается без ошибок
- [ ] TypeScript: `tsc --noEmit` — 0 ошибок
- [ ] Vercel деплой: READY (не ERROR)
- [ ] Hero показывает фото + имя + цену
- [ ] Блоки без данных не рендерятся (wardrobe пустой → блока нет)
- [ ] Форма отправляется → success сообщение
- [ ] Telegram получает уведомление с именем компаньона
- [ ] Sticky bar появляется при скролле
- [ ] SEO metadata сохранена (`generateMetadata` не изменён)
- [ ] `revalidate = 60` сохранён
- [ ] Мобильная версия не сломана (проверить на 375px)
- [ ] Глобальный nav и floating кнопки не дублируются

---

## ЧТО НЕ ТРОГАТЬ

- `src/app/companions/page.tsx` — список компаньонов
- `src/components/public/BookingWidget.tsx` — файл оставить, убрать только импорт
- `src/components/public/BookingModal.tsx`
- `src/components/layout/Navbar.tsx`
- `src/components/layout/FloatingContacts.tsx`
- `next.config.js`
- `prisma/schema.prisma`
- `src/app/api/*` — все API роуты
- `src/app/admin/*` — admin панель
- SEO файлы: `sitemap.ts`, `robots.ts`
- Каталожные стили в `companions.css`: `.catalog-*`, `.card-*`, `.sidebar-*`, `.results-*`, `.loadmore-*`, `.sort-*`


---

## ДОПОЛНЕНИЕ: SEO — что сохранить обязательно

### Сервисы должны рендериться как ссылки

В текущем коде сервисы — это `<Link href="/services/${svc.slug}">`. Это важно для внутренней перелинковки.

В блоке Services (`/* ══ 7. SERVICES ══ */`) сохранить ссылки:

```tsx
{serviceGroups[cat].map((svc: any) => (
  svc.slug ? (
    <Link key={svc.serviceId} href={`/services/${svc.slug}`} className="pr-svc-item" style={{ textDecoration: 'none' }}>
      {svc.name}
    </Link>
  ) : (
    <div key={svc.serviceId} className="pr-svc-item">{svc.name}</div>
  )
))}
```

### Проверить после деплоя

```
curl -I https://vaurel.co.uk/companions/giorgina-vegas
```
Должен вернуть `200`, не `301` или `404`.

```
curl https://vaurel.co.uk/companions/sitemap.xml
```
Все профили должны быть в sitemap.

Проверить в браузере: View Source → убедиться что:
- `<title>` присутствует
- `<meta name="description">` присутствует  
- `<link rel="canonical">` присутствует
- `<script type="application/ld+json">` присутствует
- `<h1>` только один на странице


---

# ДОПОЛНЕНИЕ: Улучшения без риска поломки

Всё ниже — только добавления. Ничего не удаляется, ничего не ломается.

---

## УЛУЧШЕНИЕ 1: AI генерация SEO для профилей (ВЫСОКИЙ ПРИОРИТЕТ)

**Проблема найдена:** У всех 9 активных моделей `seoTitle = null` и `seoDescription = null`.
Это означает что title и description генерируются из шаблона:
```
"[Name] — London Companion"
"Book [Name] — [tagline]. Verified London companion at Vaurel. From £X/hr."
```
Это слабо для SEO. Кнопка "Generate SEO" в admin уже существует — она вызывает AI.

**Задача:** Добавить в admin страницу моделей кнопку "Generate SEO for all" — пакетная генерация seoTitle + seoDescription для всех моделей у которых они пустые.

**Где реализовать:** `src/app/admin/models/page.tsx` — добавить кнопку вверху страницы.

**API уже существует:** `/api/v1/models/[id]` + AI endpoint для SEO уже есть в admin модели.

**Важно:** не трогать `generateMetadata()` в profile page — он уже правильно использует seoTitle/seoDescription если они заполнены.

---

## УЛУЧШЕНИЕ 2: Имена моделей — привести к Title Case (БЫСТРОЕ)

**Проблема найдена:** В БД: `"angelina"`, `"VERUCA"`, `"Inciona "` (с пробелом).
На сайте рендерятся некрасиво и непрофессионально.

**Задача:** В `getProfileData()` добавить нормализацию имени:

```typescript
// После получения model из БД:
name: model.name.trim().replace(/\b\w/g, c => c.toUpperCase()),
```

**Где:** `src/app/companions/[slug]/page.tsx` в функции `getProfileData()`.
**Также:** `src/app/companions/page.tsx` — в запросе моделей для каталога.

**Не ломает ничего** — только визуальное улучшение.

---

## УЛУЧШЕНИЕ 3: ModelCard — использовать nationality из stats (БЫСТРОЕ)

**Проблема найдена:** `ModelCard` принимает `nationality` проп, но при рендере похожих моделей в профиле передаётся `sim.tagline` вместо `sim.stats?.nationality`. В текущем коде:

```tsx
// Текущий код — передаёт tagline как nationality
<ModelCard
  name={sim.name}
  slug={sim.slug}
  tagline={sim.tagline}   // ← это tagline, а не nationality
  ...
```

**Задача:** В запросе `similarModels` добавить `stats: { select: { nationality: true } }` и передавать `sim.stats?.nationality ?? null`.

**Где:** `src/app/companions/[slug]/page.tsx` в блоке `similarModels`.

---

## УЛУЧШЕНИЕ 4: Breadcrumb с Schema.org (SEO)

**Проблема найдена:** Breadcrumb есть визуально, но нет Schema.org разметки `BreadcrumbList`. Google любит это и показывает хлебные крошки в поисковой выдаче.

**Задача:** Добавить JSON-LD для breadcrumb рядом с существующим profileSchema:

```typescript
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Companions', item: `${BASE_URL}/companions` },
    { '@type': 'ListItem', position: 3, name: profile.name, item: `${BASE_URL}/companions/${profile.slug}` },
  ],
}
```

Добавить второй `<script type="application/ld+json">` тег в JSX.

**Не трогает** существующий `profileSchema`.

---

## УЛУЧШЕНИЕ 5: Open Graph image — использовать реальное фото (SEO / Social)

**Проблема найдена:** В `generateMetadata` уже есть:
```typescript
openGraph: {
  images: profile.primaryPhoto ? [{ url: profile.primaryPhoto }] : [],
},
```
Это уже правильно. Но не указаны `width`, `height`, `alt` — без них некоторые платформы игнорируют OG image.

**Задача:** Улучшить OG image объект:

```typescript
openGraph: {
  images: profile.primaryPhoto ? [{
    url: profile.primaryPhoto,
    width: 1200,
    height: 1600,
    alt: `${profile.name} — London companion Vaurel`,
  }] : [],
},
```

**Где:** `generateMetadata()` в `src/app/companions/[slug]/page.tsx`.

---

## УЛУЧШЕНИЕ 6: Twitter/X Card метаданные (Social)

**Проблема найдена:** В `generateMetadata` нет Twitter card для профилей — только глобальная в `layout.tsx`.

**Задача:** Добавить в `generateMetadata`:

```typescript
twitter: {
  card: 'summary_large_image',
  title: profile.seoTitle ?? `${profile.name} — London Companion | Vaurel`,
  description: profile.seoDescription ?? `${profile.tagline ?? ''}. Verified London companion.`,
  images: profile.primaryPhoto ? [profile.primaryPhoto] : [],
},
```

---

## УЛУЧШЕНИЕ 7: Vicky — нет района (ДАННЫЕ)

**Проблема найдена:** Модель Vicky (slug: `vicky`) не имеет привязки к району. На странице не будет отображаться локация. Это нужно исправить в admin, не в коде.

**Задача для операционной команды:** Зайти в `/admin/models/vicky` → Locations → добавить район.

---

## УЛУЧШЕНИЕ 8: `// @ts-nocheck` убрать из `companions/page.tsx`

**Проблема найдена:** В `src/app/companions/page.tsx` строка 1: `// @ts-nocheck`. TypeScript выключен. После последнего коммита `fix: resolve all TypeScript errors` TypeScript strict включён везде кроме этого файла.

**Задача:** Убрать `// @ts-nocheck` из `companions/page.tsx` и исправить все возникшие ошибки типов.

**Не ломает функционал** — только улучшает надёжность кода.

---

## УЛУЧШЕНИЕ 9: `dataCompletenessScore` — пересчитать после изменений (ДАННЫЕ)

**Проблема найдена:** У всех 9 моделей `dataCompletenessScore = 0`. Это поле используется в admin dashboard для отображения "AVG Completeness". Функция `auditModelReadiness` считает score динамически но не сохраняет его в БД.

**Задача:** В PATCH `/api/v1/models/[id]` после сохранения вызывать `auditModelReadiness(model.id)` и записывать результат в `model.dataCompletenessScore`.

Это уже частично описано в документе Quick Upload — просто нужно добавить вызов в PATCH endpoint.

---

## ПРИОРИТЕТ УЛУЧШЕНИЙ

| # | Улучшение | Приоритет | Время |
|---|---|---|---|
| 1 | AI генерация SEO для всех профилей | 🔴 Высокий | 2ч |
| 2 | Title Case для имён моделей | 🟠 Средний | 30мин |
| 3 | ModelCard nationality fix | 🟠 Средний | 15мин |
| 4 | Breadcrumb Schema.org | 🟠 Средний | 15мин |
| 5 | OG image width/height/alt | 🟡 Низкий | 10мин |
| 6 | Twitter card метаданные | 🟡 Низкий | 10мин |
| 7 | Vicky — добавить район (admin) | 🟠 Средний | 5мин |
| 8 | Убрать ts-nocheck из companions/page | 🟡 Низкий | 30мин |
| 9 | dataCompletenessScore пересчёт | 🟡 Низкий | 1ч |

**Улучшения 2, 3, 4, 5, 6** — можно включить прямо в основной коммит редизайна профиля.
**Улучшение 1** — отдельный коммит после редизайна.
**Улучшение 7** — операционная задача, не код.

