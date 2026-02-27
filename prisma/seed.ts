import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('changeme123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@virel.com' },
    update: {},
    create: {
      email: 'admin@virel.com',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create manager (Tommy)
  const tommyPassword = await bcrypt.hash('tommy123', 10)
  const tommy = await prisma.user.upsert({
    where: { email: 'tommy@virel.com' },
    update: {},
    create: {
      email: 'tommy@virel.com',
      password: tommyPassword,
      name: 'Tommy',
      role: 'MANAGER',
    },
  })
  console.log('✅ Manager created:', tommy.email)

  // Create reception staff
  const reception = ['lukas', 'sasha', 'adam', 'donald']
  for (const name of reception) {
    const password = await bcrypt.hash(`${name}123`, 10)
    const user = await prisma.user.upsert({
      where: { email: `${name}@virel.com` },
      update: {},
      create: {
        email: `${name}@virel.com`,
        password,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        role: 'RECEPTION',
      },
    })
    console.log('✅ Reception user created:', user.email)
  }

  // Create sample models
  const models = [
    {
      slug: 'sophia-mayfair',
      name: 'Sophia',
      age: 24,
      nationality: 'British',
      location: ['Mayfair', 'Kensington'],
      height: 170,
      weight: 55,
      hairColor: 'Blonde',
      eyeColor: 'Blue',
      breastSize: 'C',
      description: 'Elegant and sophisticated, Sophia brings a perfect blend of intelligence and charm to every encounter. A graduate in Business Management, she is equally comfortable at high-end social events as she is in intimate settings. Her warm personality and genuine interest in people make every moment memorable.',
      languages: ['English', 'French'],
      services: {
        incall: true,
        outcall: true,
        duo: true,
        overnight: true,
        rates: {
          incall: 400,
          outcall: 500,
        },
      },
      photos: [
        '/images/models/sophia-1.jpg',
        '/images/models/sophia-2.jpg',
        '/images/models/sophia-3.jpg',
      ],
      metaTitle: 'Sophia - Premium Companion in Mayfair | Virel London',
      metaDescription: 'Meet Sophia, 24-year-old British blonde companion in Mayfair. Elegant, sophisticated, and verified. Available for incall and outcall services.',
      status: 'ACTIVE',
      verified: true,
      featured: true,
    },
    {
      slug: 'isabella-kensington',
      name: 'Isabella',
      age: 26,
      nationality: 'Italian',
      location: ['Kensington', 'Chelsea'],
      height: 175,
      weight: 58,
      hairColor: 'Brunette',
      eyeColor: 'Green',
      breastSize: 'D',
      description: 'Isabella embodies the essence of Mediterranean beauty and passion. With a background in fashion and art, she brings creativity and elegance to every experience. Her multilingual abilities and worldly perspective make her the perfect companion for international travelers and sophisticated gentlemen.',
      languages: ['English', 'Italian', 'Spanish'],
      services: {
        incall: true,
        outcall: true,
        duo: true,
        overnight: true,
        rates: {
          incall: 450,
          outcall: 550,
        },
      },
      photos: [
        '/images/models/isabella-1.jpg',
        '/images/models/isabella-2.jpg',
        '/images/models/isabella-3.jpg',
      ],
      metaTitle: 'Isabella - Italian Companion in Kensington | Virel London',
      metaDescription: 'Meet Isabella, 26-year-old Italian brunette companion in Kensington. Elegant, cultured, and multilingual. Premium services available.',
      status: 'ACTIVE',
      verified: true,
      featured: true,
    },
    {
      slug: 'olivia-chelsea',
      name: 'Olivia',
      age: 23,
      nationality: 'British',
      location: ['Chelsea', 'Belgravia'],
      height: 168,
      weight: 52,
      hairColor: 'Blonde',
      eyeColor: 'Blue',
      breastSize: 'B',
      description: 'Olivia is the epitome of English rose beauty. A trained dancer with grace and poise, she brings energy and enthusiasm to every encounter. Her youthful spirit combined with mature sophistication creates a unique and captivating experience.',
      languages: ['English'],
      services: {
        incall: true,
        outcall: true,
        duo: false,
        overnight: true,
        rates: {
          incall: 350,
          outcall: 450,
        },
      },
      photos: [
        '/images/models/olivia-1.jpg',
        '/images/models/olivia-2.jpg',
        '/images/models/olivia-3.jpg',
      ],
      metaTitle: 'Olivia - Young British Companion in Chelsea | Virel London',
      metaDescription: 'Meet Olivia, 23-year-old British blonde companion in Chelsea. Graceful dancer with youthful energy. Verified and highly recommended.',
      status: 'ACTIVE',
      verified: true,
      featured: true,
    },
  ]

  for (const modelData of models) {
    const model = await prisma.model.upsert({
      where: { slug: modelData.slug },
      update: {},
      create: modelData,
    })
    console.log('✅ Model created:', model.name)
  }

  console.log('✨ Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
