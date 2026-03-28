const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updates = [
    { slug: 'marsalina', tagline: 'Warm. Attentive. Present.' },
    { slug: 'marzena', tagline: 'Warm. Easy to be around.' },
    { slug: 'angelina', tagline: 'Calm. Attentive. Discreet.' },
    { slug: 'camille', tagline: 'Relaxed. Genuine. Present.' },
    { slug: 'veruca', tagline: 'Playful. Open. Effortless.' },
    { slug: 'burana', tagline: 'Vibrant. Warm. Confident.' },
    { slug: 'vicky', tagline: 'Gentle. Playful. Discreet.' },
    { slug: 'watari', tagline: 'Exotic. Mysterious. Present.' },
  ];
  for (const u of updates) {
    const r = await prisma.model.updateMany({ where: { slug: u.slug }, data: { tagline: u.tagline } });
    console.log(u.slug + ': ' + r.count + ' updated');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1); });
