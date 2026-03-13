// GLOBAL SEARCH SERVICE
// Search across clients, bookings, models, inquiries

import { prisma } from '@/lib/db/client';

type SearchResult = {
  entityType: string;
  entityId: string;
  displayText: string;
  secondaryText: string;
  route: string;
};

export async function globalSearch(query: string, _actorId: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const q = query.trim();
  const results: SearchResult[] = [];

  // Search Clients: fullName, email, phone
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ],
      deletedAt: null,
    },
    select: { id: true, fullName: true, email: true },
    take: 5,
  });
  for (const c of clients) {
    results.push({
      entityType: 'client',
      entityId: c.id,
      displayText: c.fullName ?? '',
      secondaryText: c.email ?? '',
      route: `/admin/clients/${c.id}`,
    });
  }

  // Search Bookings: shortId
  const bookings = await prisma.booking.findMany({
    where: {
      shortId: { contains: q, mode: 'insensitive' },
    },
    select: { id: true, shortId: true, status: true },
    take: 5,
  });
  for (const b of bookings) {
    results.push({
      entityType: 'booking',
      entityId: b.id,
      displayText: b.shortId || b.id,
      secondaryText: b.status,
      route: `/admin/bookings/${b.id}`,
    });
  }

  // Search Models: name, publicCode
  const models = await prisma.model.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { publicCode: { contains: q, mode: 'insensitive' } },
      ],
      deletedAt: null,
    },
    select: { id: true, name: true, publicCode: true },
    take: 5,
  });
  for (const m of models) {
    results.push({
      entityType: 'model',
      entityId: m.id,
      displayText: m.name,
      secondaryText: m.publicCode ?? '',
      route: `/admin/models/${m.id}`,
    });
  }

  // Search Inquiries: id prefix match
  const inquiries = await prisma.inquiry.findMany({
    where: {
      id: { startsWith: q },
    },
    select: { id: true, subject: true, status: true },
    take: 5,
  });
  for (const i of inquiries) {
    results.push({
      entityType: 'inquiry',
      entityId: i.id,
      displayText: i.subject || i.id,
      secondaryText: i.status,
      route: `/admin/inquiries/${i.id}`,
    });
  }

  return results;
}
