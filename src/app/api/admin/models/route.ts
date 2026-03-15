import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { randomUUID } from 'crypto'
import { ensureExtensionTables } from '@/lib/db/ensure-tables'

function slugify(name: string) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    await ensureExtensionTables()
    const body = await request.json()

    // Unique slug
    let slug = slugify(body.name)
    const existing = await prisma.model.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    // Public code
    const publicCode = `${body.name.toUpperCase().replace(/\s+/g, '-').substring(0, 12)}-${randomUUID().substring(0, 8).toUpperCase()}`

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
        status: body.status || 'active',
        
        notesInternal: body.notesInternal || body.internalNotes || null,
        primaryLocationId,
        // New fields
        workingName: body.workingName || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        ageForWeb: body.ageForWeb ? Number(body.ageForWeb) : (body.age ? Number(body.age) : null),
        ethnicity: body.ethnicity || null,
        hairLength: body.hairLength || null,
        tagline: body.tagline || null,
        bio: body.bio || null,
        internalRating: body.internalRating != null ? Number(body.internalRating) : null,
        measurements: body.measurements || null,
        travel: body.travel || null,
        wardrobe: Array.isArray(body.wardrobe) ? body.wardrobe : [],
        piercingDetails: Array.isArray(body.piercings) ? body.piercings : (Array.isArray(body.piercingDetails) ? body.piercingDetails : []),
        // Contact
        phone: body.phone || null,
        phone2: body.phone2 || null,
        email: body.email || null,
        telegramPhone: body.telegramPhone || null,
        telegramTag: body.telegramTag ? body.telegramTag.replace(/^@/, '') : null,
        whatsapp: body.whatsapp === true,
        telegram: body.telegram === true,
        viber: body.viber === true,
        signal: body.signal === true,
        // Address
        postcode: body.postcode || body.addressPostcode || null,
        street: body.street || body.addressStreet || null,
        houseNumber: body.houseNumber || null,
        floor: body.floor || null,
        flatNumber: body.flatNumber || body.addressFlat || null,
        nearestStation: body.nearestStation || body.tubeStation || null,
        // Availability
        availableAllDay: body.availableAllDay === true,
        availableDays: Array.isArray(body.availableDays) ? body.availableDays : [],
        // Payment
        paymentCash: body.paymentCash === true,
        paymentTerminal: body.paymentTerminal === true,
        paymentBankTransfer: body.paymentBankTransfer === true,
        paymentMonese: body.paymentMonese === true,
        paymentMonzo: body.paymentMonzo === true,
        paymentRevolut: body.paymentRevolut === true,
        paymentStarling: body.paymentStarling === true,
        paymentBTC: body.paymentBTC === true,
        paymentLTC: body.paymentLTC === true,
        paymentUSDT: body.paymentUSDT === true,
        // Preferences
        worksWithCouples: body.worksWithCouples === true || body.workWithCouples === true,
        worksWithWomen: body.worksWithWomen === true || body.workWithWomen === true,
        willingDisabled: body.willingDisabled === true || body.disabledClients === true,
        willingPrivatePlaces: body.willingPrivatePlaces === true,
        willingInternational: body.willingInternational === true,
        willingLongDistance: body.willingLongDistance === true,
        hasFlatmates: body.hasFlatmates === true,
        dinnerDates: body.dinnerDates === true,
        travelCompanion: body.travelCompanion === true,
        stats: {
          create: {
            age: body.ageForWeb ? Number(body.ageForWeb) : (body.age ? Number(body.age) : null),
            height: body.height ? Number(body.height) : null,
            weight: body.weight ? Number(body.weight) : null,
            dressSize: body.dressSize || body.dressSizeUK || null,
            feetSize: body.footSize || body.feetSizeUK || null,
            bustSize: body.bustSize || body.breastSize || null,
            bustType: body.bustType || body.breastType || null,
            eyeColour: body.eyeColor || body.eyesColour || null,
            hairColour: body.hairColor || body.hairColour || null,
            smokingStatus: body.smoking || body.smokingStatus || null,
            tattooStatus: body.tattoo || body.tattooStatus || null,
            piercingStatus: Array.isArray(body.piercings) ? body.piercings.join(', ') : (body.piercingTypes || null),
            nationality: body.nationality || null,
            orientation: body.orientation || null,
            languages: Array.isArray(body.languages)
              ? body.languages.map((l: any) => typeof l === 'string' ? l : `${l.language} (${l.level})`).filter(Boolean)
              : (body.languages ? body.languages.split(',').map((l: string) => l.trim()).filter(Boolean) : []),
          }
        }
      },
    })

    // Services — supports both string[] and {code, extraPrice}[] formats
    // Codes from AI parsing are uppercase (GFE, OWO), slugs in DB are lowercase (gfe, owo)
    if (body.services && body.services.length > 0) {
      const serviceItems: { code: string; extraPrice?: number }[] = body.services.map((s: any) =>
        typeof s === 'string' ? { code: s } : s
      )
      const slugs = serviceItems.map(s => s.code.toLowerCase().replace(/_/g, '-'))
      const dbServices = await prisma.$queryRaw<{ id: string; slug: string }[]>`
        SELECT id, slug FROM services WHERE slug = ANY(${slugs}::text[])
      `
      const slugToId = Object.fromEntries(dbServices.map(s => [s.slug, s.id]))
      for (const item of serviceItems) {
        const slug = item.code.toLowerCase().replace(/_/g, '-')
        const serviceId = slugToId[slug]
        if (!serviceId) continue
        try {
          await prisma.$executeRawUnsafe(
            `INSERT INTO model_services ("modelId", "serviceId", "isEnabled")
             VALUES ($1, $2, true)
             ON CONFLICT ("modelId", "serviceId") DO UPDATE SET
               "isEnabled" = true`,
            model.id, serviceId
          )
        } catch {}
      }
    }

    // Rates — use model_id (snake_case) matching the actual table column
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
    ].filter(r => r.price)

    for (const rate of rateMap) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO model_rates (id, model_id, duration_type, call_type, price, currency, is_active)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, 'GBP', true)`,
          model.id,
          rate.duration_type,
          rate.call_type,
          Number(rate.price)
        )
      } catch {}
    }

    // Address — insert into model_addresses
    const hasAddress = body.addressStreet || body.addressPostcode || body.tubeStation
    if (hasAddress) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO model_addresses (
             id, model_id, street, flat_number, post_code, tube_station,
             heathrow_available, gatwick_available, stansted_available, is_active
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
           ON CONFLICT (id) DO UPDATE SET
             street = EXCLUDED.street,
             flat_number = EXCLUDED.flat_number,
             post_code = EXCLUDED.post_code,
             tube_station = EXCLUDED.tube_station,
             heathrow_available = EXCLUDED.heathrow_available,
             gatwick_available = EXCLUDED.gatwick_available,
             stansted_available = EXCLUDED.stansted_available`,
          `${model.id}-addr`,
          model.id,
          body.addressStreet || null,
          body.addressFlat || null,
          body.addressPostcode || null,
          body.tubeStation || null,
          body.airportHeathrow === true,
          body.airportGatwick === true,
          body.airportStansted === true
        )
      } catch {}
    }

    // Work preferences — insert into model_work_preferences
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO model_work_preferences (
           id, model_id, work_with_couples, work_with_women,
           black_clients_welcome, disabled_clients_welcome
         ) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           work_with_couples = EXCLUDED.work_with_couples,
           work_with_women = EXCLUDED.work_with_women,
           black_clients_welcome = EXCLUDED.black_clients_welcome,
           disabled_clients_welcome = EXCLUDED.disabled_clients_welcome`,
        `${model.id}-prefs`,
        model.id,
        body.workWithCouples === true,
        body.workWithWomen === true,
        body.blackClients !== false,
        body.disabledClients !== false
      )
    } catch {}

    return NextResponse.json({ success: true, modelId: model.id, slug: model.slug })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
