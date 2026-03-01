import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { randomUUID } from 'crypto'

function slugify(name: string) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Unique slug
    let slug = slugify(body.name)
    const existing = await prisma.model.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    // Public code
    const publicCode = `${body.name.toUpperCase().replace(/\s+/g, '-').substring(0, 12)}-${Math.floor(Math.random() * 90 + 10)}`

    // Location by tube station
    let primaryLocationId: string | null = null
    if (body.tubeStation) {
      const locSlug = slugify(body.tubeStation)
      let loc = await prisma.location.findFirst({ where: { slug: locSlug } })
      if (!loc) {
        loc = await prisma.location.create({
          data: { title: body.tubeStation, slug: locSlug, status: 'active' }
        })
      }
      primaryLocationId = loc.id
    }

    // Create model + stats
    const model = await prisma.model.create({
      data: {
        name: body.name,
        slug,
        publicCode,
        status: 'active',
        visibility: 'public',
        notesInternal: body.notesInternal || null,
        primaryLocationId,
        stats: {
          create: {
            age:           body.age    ? Number(body.age)    : null,
            height:        body.height ? Number(body.height) : null,
            weight:        body.weight ? Number(body.weight) : null,
            dressSize:     body.dressSizeUK  || null,
            bustSize:      body.breastSize   || null,
            bustType:      body.breastType   || null,
            eyeColour:     body.eyesColour   || null,
            hairColour:    body.hairColour   || null,
            smokingStatus: body.smokingStatus || null,
            tattooStatus:  body.tattooStatus  || null,
            piercingStatus:body.piercingTypes || null,
            nationality:   body.nationality  || null,
            orientation:   body.orientation  || null,
            languages: Array.isArray(body.languages)
              ? body.languages
              : (body.languages ? body.languages.split(',').map((l: string) => l.trim()).filter(Boolean) : []),
          }
        }
      },
    })

    // ── Services ──────────────────────────────────────────────────────────
    if (body.services && body.services.length > 0) {
      const dbServices = await prisma.service.findMany({
        where: { slug: { in: body.services } }
      })
      for (const svc of dbServices) {
        try {
          await prisma.$executeRaw`
            INSERT INTO model_services ("modelId", "serviceId", "isEnabled")
            VALUES (${model.id}, ${svc.id}, true)
            ON CONFLICT DO NOTHING
          `
        } catch {}
      }
    }

    // ── Rates ─────────────────────────────────────────────────────────────
    const rateMap = [
      { duration_type: '30min',      call_type: 'incall',  price: body.rate30min },
      { duration_type: '45min',      call_type: 'incall',  price: body.rate45min },
      { duration_type: '1hour',      call_type: 'incall',  price: body.rate1hIn },
      { duration_type: '1hour',      call_type: 'outcall', price: body.rate1hOut },
      { duration_type: '90min',      call_type: 'incall',  price: body.rate90minIn },
      { duration_type: '90min',      call_type: 'outcall', price: body.rate90minOut },
      { duration_type: '2hours',     call_type: 'incall',  price: body.rate2hIn },
      { duration_type: '2hours',     call_type: 'outcall', price: body.rate2hOut },
      { duration_type: 'extra_hour', call_type: 'incall',  price: body.rateExtraHour },
      { duration_type: 'overnight',  call_type: 'incall',  price: body.rateOvernight },
    ].filter(r => r.price != null && r.price !== '' && Number(r.price) > 0)

    for (const rate of rateMap) {
      try {
        await prisma.$executeRaw`
          INSERT INTO model_rates (id, model_id, duration_type, call_type, price, currency, is_active, created_at)
          VALUES (${randomUUID()}, ${model.id}, ${rate.duration_type}, ${rate.call_type}, ${Number(rate.price)}, 'GBP', true, now())
          ON CONFLICT DO NOTHING
        `
      } catch (e: any) {
        console.error('[rates error]', e.message)
      }
    }

    // ── Address ───────────────────────────────────────────────────────────
    if (body.addressStreet || body.addressPostcode) {
      try {
        await prisma.$executeRaw`
          INSERT INTO model_addresses (id, model_id, street, flat_number, post_code, tube_station, is_active, created_at)
          VALUES (
            ${randomUUID()},
            ${model.id},
            ${body.addressStreet || ''},
            ${body.addressFlat || null},
            ${body.addressPostcode || ''},
            ${body.tubeStation || null},
            true,
            now()
          )
        `
      } catch (e: any) {
        console.error('[address error]', e.message)
      }
    }

    // ── Work preferences ──────────────────────────────────────────────────
    try {
      await prisma.$executeRaw`
        INSERT INTO model_work_preferences (id, model_id, work_with_couples, work_with_women, black_clients_welcome, disabled_clients_welcome, created_at)
        VALUES (
        ${randomUUID()},
          ${model.id},
          ${body.workWithCouples === true},
          ${body.workWithWomen === true},
          ${body.blackClients !== false},
          ${body.disabledClients !== false},
          now()
        )
        ON CONFLICT DO NOTHING
      `
    } catch (e: any) {
      console.error('[prefs error]', e.message)
    }

    return NextResponse.json({ success: true, modelId: model.id, slug: model.slug })
  } catch (error: any) {
    console.error('[models POST error]', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
