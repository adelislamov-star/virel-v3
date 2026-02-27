// SEED DATA v3 - Operations Platform
// Seeds: Roles, Permissions, Users, Locations, Models, Inquiries, Bookings, Tasks

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database v3...');
  
  // 1. ROLES
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { code: 'OWNER' },
      update: {},
      create: { code: 'OWNER', name: 'Owner', description: 'Full access' }
    }),
    prisma.role.upsert({
      where: { code: 'OPS_MANAGER' },
      update: {},
      create: { code: 'OPS_MANAGER', name: 'Operations Manager', description: 'Manage operations' }
    }),
    prisma.role.upsert({
      where: { code: 'OPERATOR' },
      update: {},
      create: { code: 'OPERATOR', name: 'Operator', description: 'Action Center' }
    }),
    prisma.role.upsert({
      where: { code: 'CONTENT_MANAGER' },
      update: {},
      create: { code: 'CONTENT_MANAGER', name: 'Content Manager', description: 'Manage content' }
    }),
    prisma.role.upsert({
      where: { code: 'FINANCE' },
      update: {},
      create: { code: 'FINANCE', name: 'Finance', description: 'Manage finances' }
    })
  ]);
  
  // 2. USERS
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const adel = await prisma.user.upsert({
    where: { email: 'admin@virel.com' },
    update: {},
    create: {
      email: 'admin@virel.com',
      passwordHash,
      name: 'Adel',
      status: 'active'
    }
  });
  
  const tommy = await prisma.user.upsert({
    where: { email: 'tommy@virel.com' },
    update: {},
    create: {
      email: 'tommy@virel.com',
      passwordHash,
      name: 'Tommy',
      status: 'active',
      telegramChatId: '321654987'
    }
  });
  
  const operators = await Promise.all([
    prisma.user.upsert({
      where: { email: 'lukas@virel.com' },
      update: {},
      create: {
        email: 'lukas@virel.com',
        passwordHash,
        name: 'Lukas',
        status: 'active',
        telegramChatId: '123456789'
      }
    }),
    prisma.user.upsert({
      where: { email: 'sasha@virel.com' },
      update: {},
      create: {
        email: 'sasha@virel.com',
        passwordHash,
        name: 'Sasha',
        status: 'active',
        telegramChatId: '987654321'
      }
    }),
    prisma.user.upsert({
      where: { email: 'adam@virel.com' },
      update: {},
      create: {
        email: 'adam@virel.com',
        passwordHash,
        name: 'Adam',
        status: 'active',
        telegramChatId: '456789123'
      }
    }),
    prisma.user.upsert({
      where: { email: 'donald@virel.com' },
      update: {},
      create: {
        email: 'donald@virel.com',
        passwordHash,
        name: 'Donald',
        status: 'active',
        telegramChatId: '789123456'
      }
    })
  ]);
  
  // Assign roles
  const ownerRole = roles.find(r => r.code === 'OWNER')!;
  const managerRole = roles.find(r => r.code === 'OPS_MANAGER')!;
  const operatorRole = roles.find(r => r.code === 'OPERATOR')!;
  
  await prisma.userRole.createMany({
    data: [
      { userId: adel.id, roleId: ownerRole.id },
      { userId: tommy.id, roleId: managerRole.id },
      ...operators.map(op => ({ userId: op.id, roleId: operatorRole.id }))
    ],
    skipDuplicates: true
  });
  
  // 3. LOCATIONS
  console.log('Creating locations...');
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { slug: 'mayfair' },
      update: {},
      create: { title: 'Mayfair', slug: 'mayfair', county: 'London', isPopular: true }
    }),
    prisma.location.upsert({
      where: { slug: 'kensington' },
      update: {},
      create: { title: 'Kensington', slug: 'kensington', county: 'London', isPopular: true }
    }),
    prisma.location.upsert({
      where: { slug: 'knightsbridge' },
      update: {},
      create: { title: 'Knightsbridge', slug: 'knightsbridge', county: 'London', isPopular: true }
    })
  ]);
  
  // 4. SERVICES
  console.log('Creating services...');
  const services = await Promise.all([
    prisma.service.upsert({
      where: { slug: 'gfe' },
      update: {},
      create: { title: 'GFE', slug: 'gfe', isPopular: true }
    }),
    prisma.service.upsert({
      where: { slug: 'dinner-date' },
      update: {},
      create: { title: 'Dinner Date', slug: 'dinner-date', isPopular: true }
    }),
    prisma.service.upsert({
      where: { slug: 'massage' },
      update: {},
      create: { title: 'Massage', slug: 'massage' }
    })
  ]);
  
  // 5. MODELS
  console.log('Creating models...');
  const sophia = await prisma.model.upsert({
    where: { slug: 'sophia-mayfair' },
    update: {},
    create: {
      publicCode: 'SOPHIA-MF',
      name: 'Sophia',
      slug: 'sophia-mayfair',
      primaryLocationId: locations[0].id,
      status: 'active',
      visibility: 'public',
      ratingInternal: 4.9
    }
  });
  
  await prisma.modelStats.upsert({
    where: { modelId: sophia.id },
    update: {},
    create: {
      modelId: sophia.id,
      age: 25,
      height: 168,
      hairColour: 'Blonde',
      eyeColour: 'Blue',
      nationality: 'British',
      languages: ['English', 'French']
    }
  });
  
  // Link services
  await prisma.modelService.createMany({
    data: services.map(s => ({ modelId: sophia.id, serviceId: s.id })),
    skipDuplicates: true
  });
  
  // 6. CLIENT
  console.log('Creating clients...');
  const client = await prisma.client.create({
    data: {
      fullName: 'Alan Smith',
      email: 'alan@example.com',
      phone: '+447958457775',
      preferredChannel: 'web',
      tags: ['regular']
    }
  });
  
  // 7. INQUIRY
  console.log('Creating inquiries...');
  const inquiry = await prisma.inquiry.create({
    data: {
      source: 'web',
      clientId: client.id,
      status: 'new',
      priority: 'normal',
      subject: 'Booking request',
      message: 'Looking for a companion for dinner date',
      requestedLocationId: locations[0].id,
      requestedTimeFrom: new Date('2026-12-23T19:00:00Z'),
      requestedTimeTo: new Date('2026-12-23T23:00:00Z')
    }
  });
  
  // 8. TASK for inquiry
  console.log('Creating tasks...');
  await prisma.task.create({
    data: {
      type: 'review_inquiry',
      status: 'open',
      priority: 'normal',
      subject: `Review inquiry from ${client.fullName}`,
      entityType: 'inquiry',
      entityId: inquiry.id,
      assignedTo: operators[0].id,
      slaDeadlineAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min
    }
  });
  
  // 9. BOOKING
  console.log('Creating bookings...');
  const booking = await prisma.booking.create({
    data: {
      inquiryId: inquiry.id,
      clientId: client.id,
      modelId: sophia.id,
      locationId: locations[0].id,
      startAt: new Date('2026-12-23T19:00:00Z'),
      endAt: new Date('2026-12-23T22:00:00Z'),
      status: 'pending',
      priceTotal: 500,
      currency: 'GBP',
      depositRequired: 150,
      depositStatus: 'none'
    }
  });
  
  // Timeline entry
  await prisma.bookingTimeline.create({
    data: {
      bookingId: booking.id,
      eventType: 'created',
      payload: { booking }
    }
  });
  
  // Task for booking
  await prisma.task.create({
    data: {
      type: 'confirm_booking',
      status: 'open',
      priority: 'high',
      subject: `Confirm booking for ${sophia.name}`,
      entityType: 'booking',
      entityId: booking.id,
      assignedTo: operators[1].id,
      slaDeadlineAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    }
  });
  
  // 10. EXCEPTION (example)
  console.log('Creating exceptions...');
  await prisma.exception.create({
    data: {
      type: 'no_show_risk',
      status: 'open',
      severity: 'high',
      entityType: 'booking',
      entityId: booking.id,
      summary: 'Client has not confirmed arrival',
      details: { bookingId: booking.id, minutesUntilStart: 30 }
    }
  });
  
  // 11. DOMAIN EVENTS
  console.log('Creating domain events...');
  await prisma.domainEvent.createMany({
    data: [
      {
        eventType: 'inquiry.created',
        entityType: 'inquiry',
        entityId: inquiry.id,
        payload: { inquiry }
      },
      {
        eventType: 'booking.created',
        entityType: 'booking',
        entityId: booking.id,
        payload: { booking }
      }
    ]
  });
  
  console.log('✅ Seed complete!');
  console.log('\n📊 Created:');
  console.log('- 5 Roles');
  console.log('- 6 Users (1 Owner, 1 Manager, 4 Operators)');
  console.log('- 3 Locations');
  console.log('- 3 Services');
  console.log('- 1 Model (Sophia)');
  console.log('- 1 Client (Alan)');
  console.log('- 1 Inquiry');
  console.log('- 1 Booking');
  console.log('- 2 Tasks');
  console.log('- 1 Exception');
  console.log('\n🔑 Login credentials:');
  console.log('Email: admin@virel.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
