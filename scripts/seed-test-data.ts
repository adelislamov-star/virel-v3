/**
 * Seed test data for Virel v3
 * Creates: 5 models, 3 clients, 5 bookings, 3 leads (inquiries)
 * Usage: npx tsx scripts/seed-test-data.ts
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Guard: skip if DB already has models
  const modelCount = await prisma.model.count();
  if (modelCount > 0) {
    console.log('DB already seeded, skipping');
    return;
  }

  await prisma.$transaction(async (tx) => {
    // ── Location (required FK for bookings) ──
    const location = await tx.location.create({
      data: {
        title: 'London',
        slug: 'london',
        county: 'Greater London',
        country: 'UK',
        timezone: 'Europe/London',
        latitude: 51.5074,
        longitude: -0.1278,
        status: 'active',
        isPopular: true,
      },
    });

    // ── Models (5) ──
    const modelsData = [
      { name: 'Sophia',   slug: 'sophia-london',   code: 'SOPHIA-LDN',   nationality: 'British',  hairColour: 'blonde',  height: 165, age: 24, dressSize: '8'  },
      { name: 'Isabella', slug: 'isabella-london',  code: 'ISABELLA-LDN', nationality: 'Italian',  hairColour: 'brunette', height: 170, age: 26, dressSize: '10' },
      { name: 'Victoria', slug: 'victoria-london',  code: 'VICTORIA-LDN', nationality: 'Russian',  hairColour: 'blonde',  height: 168, age: 23, dressSize: '8'  },
      { name: 'Natasha',  slug: 'natasha-london',   code: 'NATASHA-LDN',  nationality: 'French',   hairColour: 'brunette', height: 172, age: 25, dressSize: '10' },
      { name: 'Elena',    slug: 'elena-london',     code: 'ELENA-LDN',    nationality: 'Spanish',  hairColour: 'dark',    height: 166, age: 27, dressSize: '8'  },
    ];

    const models = [];
    for (const m of modelsData) {
      const model = await tx.model.create({
        data: {
          name: m.name,
          slug: m.slug,
          publicCode: m.code,
          status: 'published',
          visibility: 'public',
          primaryLocationId: location.id,
          ratingInternal: 4.5,
          dataCompletenessScore: 80,
          modelRiskIndex: 'green',
        },
      });

      // ModelStats (age, height, nationality, etc.)
      await tx.modelStats.create({
        data: {
          modelId: model.id,
          age: m.age,
          height: m.height,
          dressSize: m.dressSize,
          hairColour: m.hairColour,
          nationality: m.nationality,
          languages: ['English'],
        },
      });

      models.push(model);
    }

    // ── Clients (3) ──
    const clientsData = [
      { fullName: 'James Wilson',   firstName: 'James',   lastName: 'Wilson', email: 'james@example.com',   phone: '+447700900001', vipStatus: 'vip',     tags: ['vip']     },
      { fullName: 'Robert Chen',    firstName: 'Robert',  lastName: 'Chen',   email: 'robert@example.com',  phone: '+447700900002', vipStatus: null,      tags: ['regular'] },
      { fullName: 'Michael Brown',  firstName: 'Michael', lastName: 'Brown',  email: 'michael@example.com', phone: '+447700900003', vipStatus: null,      tags: ['regular'] },
    ];

    const clients = [];
    for (const c of clientsData) {
      const client = await tx.client.create({
        data: {
          fullName: c.fullName,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          preferredChannel: 'web',
          tags: c.tags,
          vipStatus: c.vipStatus,
          riskStatus: 'normal',
          language: 'en',
          city: 'London',
          country: 'UK',
        },
      });
      clients.push(client);
    }

    // ── Bookings (5) ──
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    const bookingsData: {
      clientIdx: number; modelIdx: number; status: string;
      startOffset: number; durationHours: number; price: string;
    }[] = [
      // 2 confirmed (future)
      { clientIdx: 0, modelIdx: 0, status: 'confirmed',  startOffset: 3 * day,  durationHours: 2, price: '600.00'  },
      { clientIdx: 1, modelIdx: 1, status: 'confirmed',  startOffset: 5 * day,  durationHours: 3, price: '900.00'  },
      // 2 completed (past)
      { clientIdx: 0, modelIdx: 2, status: 'completed',  startOffset: -7 * day, durationHours: 2, price: '500.00'  },
      { clientIdx: 2, modelIdx: 3, status: 'completed',  startOffset: -14 * day, durationHours: 1, price: '350.00' },
      // 1 pending
      { clientIdx: 2, modelIdx: 4, status: 'pending',    startOffset: 10 * day, durationHours: 2, price: '550.00'  },
    ];

    for (let i = 0; i < bookingsData.length; i++) {
      const b = bookingsData[i];
      const startAt = new Date(now.getTime() + b.startOffset);
      const endAt = new Date(startAt.getTime() + b.durationHours * 60 * 60 * 1000);

      await tx.booking.create({
        data: {
          shortId: `BK-${10001 + i}`,
          clientId: clients[b.clientIdx].id,
          modelId: models[b.modelIdx].id,
          locationId: location.id,
          startAt,
          endAt,
          status: b.status,
          bookingType: 'outcall',
          priceTotal: new Prisma.Decimal(b.price),
          currency: 'GBP',
          depositRequired: new Prisma.Decimal((parseFloat(b.price) * 0.3).toFixed(2)),
          depositStatus: b.status === 'completed' ? 'paid' : b.status === 'confirmed' ? 'paid' : 'none',
          paymentStatus: b.status === 'completed' ? 'paid' : b.status === 'confirmed' ? 'partial' : 'unpaid',
        },
      });
    }

    // ── Leads / Inquiries (3) ──
    const leadsData = [
      { source: 'web',      status: 'new',       priority: 'normal', subject: 'Looking for companion in London',      message: 'Interested in booking for Friday evening.' },
      { source: 'referral', status: 'contacted',  priority: 'high',   subject: 'VIP client referral',                  message: 'Referred by an existing client, looking for a premium experience.' },
      { source: 'phone',    status: 'qualified',  priority: 'normal', subject: 'Weekend booking enquiry',              message: 'Enquiring about weekend availability for two models.' },
    ];

    for (const l of leadsData) {
      await tx.inquiry.create({
        data: {
          source: l.source,
          status: l.status,
          priority: l.priority,
          subject: l.subject,
          message: l.message,
          clientId: clients[0].id,
          requestedLocationId: location.id,
        },
      });
    }
  });

  console.log('Seeded: 5 models, 3 clients, 5 bookings, 3 leads');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
