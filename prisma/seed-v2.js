const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive database seed...')
  console.log('📊 Based on: Audit reports + Competitor analysis + Professional specs')
  
  // ============================================
  // 1. USERS
  // ============================================
  console.log('\n👥 Creating users...')
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@virel.com' },
    update: {},
    create: {
      email: 'admin@virel.com',
      password: 'changeme123', // TODO: Hash in production
      name: 'Admin',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin:', admin.email)
  
  const tommy = await prisma.user.upsert({
    where: { email: 'tommy@virel.com' },
    update: {},
    create: {
      email: 'tommy@virel.com',
      password: 'tommy123',
      name: 'Tommy',
      role: 'MANAGER',
      telegramChatId: process.env.TELEGRAM_CHAT_ID_TOMMY,
    },
  })
  console.log('✅ Manager (Tommy):', tommy.email)
  
  const reception = ['lukas', 'sasha', 'adam', 'donald']
  for (const name of reception) {
    const user = await prisma.user.upsert({
      where: { email: `${name}@virel.com` },
      update: {},
      create: {
        email: `${name}@virel.com`,
        password: `${name}123`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        role: 'RECEPTION',
      },
    })
    console.log('✅ Reception:', user.email)
  }
  
  // ============================================
  // 2. GEO PAGES (9 districts) - WHITELIST
  // ============================================
  console.log('\n🗺️  Creating GEO whitelist pages (9 districts)...')
  
  const geoPages = [
    {
      slug: 'escorts-in-mayfair',
      url: '/escorts-in-mayfair',
      title: 'Escorts in Mayfair | Premium Companions | Virel London',
      metaDesc: 'Exclusive Mayfair companions. Discreet, verified, and sophisticated. Book premium services in London\'s most prestigious district.',
      h1: 'Premium Escorts in Mayfair',
      content: `Mayfair stands as London's most exclusive district, home to prestigious addresses, five-star hotels, and discerning clientele. Our carefully selected companions embody the elegance and sophistication that defines this historic neighbourhood.

**Why Choose Mayfair Companions**

Our Mayfair companions represent the pinnacle of premium companionship services. Each model undergoes rigorous verification, ensuring authenticity and professionalism. With fluency in multiple languages and extensive cultural knowledge, they seamlessly navigate high-society events, business dinners, and private encounters.

**The Mayfair Experience**

Located in the heart of West End, Mayfair offers unparalleled privacy and luxury. From Claridge's to The Connaught, our companions are familiar with the area's finest establishments. Whether attending a gallery opening in Cork Street or dining at a Michelin-starred restaurant, discretion and elegance are guaranteed.

**Service Excellence**

We understand the expectations of Mayfair's distinguished residents and visitors. Our companions provide both incall services in luxurious Mayfair apartments and outcall services to your hotel or residence. Each encounter is tailored to your preferences, ensuring an unforgettable experience.

**Booking Process**

Our streamlined booking system respects your time and privacy. Simply browse our Mayfair companions, select your preferred date and time, and receive confirmation within 30 minutes. All communications are encrypted and confidential.

**Areas We Cover**

While specializing in Mayfair, our companions also serve neighbouring prestigious districts including Belgravia, Knightsbridge, and St James's. Extended bookings and travel companionship are available for business trips and leisure travel.`,
      faqJson: {
        questions: [
          {
            question: "What makes Mayfair companions different?",
            answer: "Our Mayfair companions are selected for their sophistication, intelligence, and discretion. They're experienced in high-society settings and fluent in multiple languages."
          },
          {
            question: "How quickly can I book?",
            answer: "We provide confirmation within 30 minutes. For same-day bookings in Mayfair, we recommend booking at least 2 hours in advance."
          },
          {
            question: "Is discretion guaranteed?",
            answer: "Absolutely. All our companions sign confidentiality agreements, and we use encrypted communications for all bookings."
          },
          {
            question: "What are the rates for Mayfair?",
            answer: "Rates vary by companion and duration. Mayfair incall starts from £400/hour, with outcall services from £500/hour."
          },
          {
            question: "Do you offer overnight bookings?",
            answer: "Yes, overnight bookings are available with all our Mayfair companions. Please inquire for rates and availability."
          },
          {
            question: "Can companions travel outside Mayfair?",
            answer: "Yes, our companions are available for outcall services throughout London and can accompany you on business trips or leisure travel."
          }
        ]
      },
    },
    {
      slug: 'escorts-in-kensington',
      url: '/escorts-in-kensington',
      title: 'Escorts in Kensington | Elite Companions | Virel London',
      metaDesc: 'Sophisticated Kensington companions. Museum district elegance meets modern luxury. Verified, cultured, and discreet premium services.',
      h1: 'Elite Escorts in Kensington',
      content: `Kensington, with its world-renowned museums, elegant garden squares, and prestigious addresses, attracts a discerning international clientele. Our companions reflect this cosmopolitan sophistication, offering cultured conversation and elegant companionship.

**Cultural Sophistication**

Our Kensington companions are well-versed in arts, culture, and international affairs. Whether attending an exhibition at the V&A, dining in South Kensington, or enjoying a private evening, they bring intelligence and charm to every encounter.

**Premium Service Standards**

Each companion undergoes comprehensive verification and maintains the highest standards of presentation and professionalism. Fluency in multiple languages ensures seamless communication with our international clientele.

**Kensington Expertise**

From the boutique hotels of South Kensington to the Georgian townhouses of Holland Park, our companions know the area intimately. They can recommend the finest restaurants, suggest cultural activities, or simply provide elegant companionship in the privacy of your accommodation.

**Flexible Arrangements**

We offer both incall services in beautifully appointed Kensington apartments and outcall services throughout the borough. Extended bookings, dinner dates, and overnight companionship are available.

**Booking Convenience**

Our secure online booking system operates 24/7. Select your preferred companion, choose your date and time, and receive rapid confirmation. All personal information is encrypted and handled with complete discretion.

**International Standards**

Many of our Kensington companions are multilingual, with fluency in French, Italian, Spanish, Russian, and other languages. This makes them ideal for international visitors and expatriates seeking companionship in their native language.`,
      faqJson: {
        questions: [
          {
            question: "Are your companions multilingual?",
            answer: "Yes, many of our Kensington companions speak multiple languages including French, Italian, Spanish, Russian, and more."
          },
          {
            question: "Can I book for cultural events?",
            answer: "Absolutely. Our companions frequently attend museum exhibitions, theatre performances, and cultural events throughout Kensington."
          },
          {
            question: "What is your cancellation policy?",
            answer: "Cancellations made 24+ hours in advance receive a full refund. Cancellations within 24 hours are subject to a 50% fee."
          },
          {
            question: "Do you verify your companions?",
            answer: "Yes, all companions undergo comprehensive verification including ID checks, interviews, and photography validation."
          },
          {
            question: "Is payment secure?",
            answer: "We accept cash, bank transfers, and major credit cards. All transactions are processed securely and discreetly."
          },
          {
            question: "Can companions travel internationally?",
            answer: "Yes, travel companionship is available for business trips and leisure travel worldwide."
          }
        ]
      },
    },
    // Add remaining 7 districts with similar detailed content...
    {
      slug: 'escorts-in-knightsbridge',
      url: '/escorts-in-knightsbridge',
      title: 'Escorts in Knightsbridge | Luxury Companions | Virel',
      metaDesc: 'Knightsbridge luxury companions. Harrods sophistication, Hyde Park elegance. Premium verified services in London\'s premier shopping district.',
      h1: 'Luxury Escorts in Knightsbridge',
      content: `Knightsbridge epitomizes London luxury, home to Harrods, world-class hotels, and the most exclusive residential addresses. Our companions match this prestigious setting with impeccable style, intelligence, and discretion.`,
      faqJson: { questions: [] },
    },
    {
      slug: 'escorts-in-chelsea',
      url: '/escorts-in-chelsea',
      title: 'Escorts in Chelsea | Premium Companions | Virel London',
      metaDesc: 'Chelsea premium companions. King\'s Road chic meets riverside elegance. Sophisticated, verified, discreet services.',
      h1: 'Premium Escorts in Chelsea',
      content: `Chelsea's artistic heritage and contemporary sophistication create the perfect backdrop for premium companionship. Our Chelsea companions embody this unique blend of culture, style, and discretion.`,
      faqJson: { questions: [] },
    },
    {
      slug: 'escorts-in-belgravia',
      url: '/escorts-in-belgravia',
      title: 'Escorts in Belgravia | Elite Companions | Virel London',
      metaDesc: 'Belgravia elite companions. Embassy district discretion, Eaton Square elegance. Premium verified services.',
      h1: 'Elite Escorts in Belgravia',
      content: `Belgravia's grand Georgian architecture and diplomatic quarter discretion make it ideal for premium companionship services. Our companions understand and respect the area's exclusive nature.`,
      faqJson: { questions: [] },
    },
    {
      slug: 'escorts-in-marylebone',
      url: '/escorts-in-marylebone',
      title: 'Escorts in Marylebone | Premium Companions | Virel',
      metaDesc: 'Marylebone premium companions. Village charm, West End proximity. Sophisticated verified services.',
      h1: 'Premium Escorts in Marylebone',
      content: `Marylebone combines village charm with central London convenience. Our companions appreciate this unique character, offering refined companionship in one of London's most desirable neighbourhoods.`,
      faqJson: { questions: [] },
    },
    {
      slug: 'escorts-in-westminster',
      url: '/escorts-in-westminster',
      title: 'Escorts in Westminster | Elite Companions | Virel',
      metaDesc: 'Westminster elite companions. Political hub discretion, five-star hotel elegance. Premium services.',
      h1: 'Elite Escorts in Westminster',
      content: `Westminster, the seat of British power and home to world-famous landmarks, demands the highest standards of discretion. Our companions excel in this environment.`,
      faqJson: { questions: [] },
    },
    {
      slug: 'escorts-in-soho',
      url: '/escorts-in-soho',
      title: 'Escorts in Soho | Premium Companions | Virel London',
      metaDesc: 'Soho premium companions. Theatre district excitement, West End sophistication. Verified services.',
      h1: 'Premium Escorts in Soho',
      content: `Soho's vibrant entertainment scene and cosmopolitan atmosphere attract visitors seeking sophisticated companionship. Our Soho companions thrive in this dynamic environment.`,
      faqJson: { questions: [] },
    },
    {
      slug: 'escorts-in-canary-wharf',
      url: '/escorts-in-canary-wharf',
      title: 'Escorts in Canary Wharf | Business Companions | Virel',
      metaDesc: 'Canary Wharf business companions. Corporate elegance, riverside luxury. Premium verified services.',
      h1: 'Business Escorts in Canary Wharf',
      content: `Canary Wharf's modern business district attracts international executives and professionals. Our companions understand this corporate environment and provide professional, discreet services.`,
      faqJson: { questions: [] },
    },
  ]
  
  for (const page of geoPages) {
    const created = await prisma.sEOWhitelist.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        type: 'GEO',
        ...page,
        isPublished: true,
      },
    })
    console.log('✅ GEO page:', created.slug)
  }
  
  // ============================================
  // 3. SERVICE PAGES (4 services) - WHITELIST
  // ============================================
  console.log('\n🎯 Creating SERVICE whitelist pages (4 services)...')
  
  const servicePages = [
    {
      slug: 'gfe',
      url: '/services/gfe',
      title: 'GFE Escorts London | Girlfriend Experience | Virel',
      metaDesc: 'Authentic girlfriend experience in London. Genuine connection, natural chemistry, premium GFE companions. Verified and sophisticated.',
      h1: 'GFE Escorts in London',
      content: `The Girlfriend Experience (GFE) represents the pinnacle of authentic companionship. Beyond physical attraction, GFE encompasses genuine connection, natural chemistry, and emotional intimacy that mirrors a real relationship.

**Understanding GFE**

GFE is about creating an authentic experience where both parties feel comfortable, valued, and genuinely connected. Our GFE companions excel at building natural rapport, engaging in meaningful conversation, and creating moments that feel spontaneous rather than transactional.

**What Makes Our GFE Different**

Unlike standard companionship, our GFE specialists focus on emotional intelligence and genuine connection. They're skilled at reading social cues, adapting to your personality, and creating an atmosphere where authentic feelings can develop naturally.

**Ideal For**

Business travelers seeking genuine connection, professionals desiring authentic companionship, or anyone who values emotional intimacy alongside physical attraction. GFE is perfect for extended bookings, dinner dates, overnight stays, and travel companionship.

**Our GFE Companions**

Each GFE specialist is selected for emotional maturity, conversational skills, and genuine warmth. They understand that great GFE requires chemistry, and we help match you with companions whose personality complements yours.

**Booking GFE Services**

We recommend longer bookings (4+ hours) for optimal GFE experiences. This allows time for genuine connection to develop naturally. Many clients prefer overnight bookings or weekend arrangements for the most authentic girlfriend experience.`,
      faqJson: {
        questions: [
          {
            question: "What exactly is GFE?",
            answer: "GFE (Girlfriend Experience) focuses on creating authentic connection and emotional intimacy. It includes natural conversation, genuine affection, and experiences that mirror a real relationship."
          },
          {
            question: "How is GFE different from standard services?",
            answer: "GFE emphasizes emotional connection and natural chemistry over purely physical interaction. It's about creating an experience that feels genuine and spontaneous."
          },
          {
            question: "What's the minimum booking time for GFE?",
            answer: "We recommend a minimum of 4 hours for GFE services to allow authentic connection to develop. Many clients prefer overnight or weekend bookings."
          },
          {
            question: "Can I request specific personality traits?",
            answer: "Yes, we'll help match you with companions whose personality, interests, and communication style complement yours for optimal chemistry."
          },
          {
            question: "Is GFE available for travel?",
            answer: "Absolutely. GFE is ideal for travel companionship, whether for business trips or leisure vacations."
          },
          {
            question: "How do you ensure genuine connections?",
            answer: "We carefully match companions based on compatibility factors and encourage extended bookings that allow natural rapport to develop."
          }
        ]
      },
    },
    {
      slug: 'dinner-date',
      url: '/services/dinner-date',
      title: 'Dinner Date Escorts London | Restaurant Companions | Virel',
      metaDesc: 'Sophisticated dinner date companions in London. Michelin-star elegance, engaging conversation. Premium restaurant escorts.',
      h1: 'Dinner Date Escorts in London',
      content: `London's culinary scene deserves equally sophisticated companionship. Our dinner date companions combine impeccable table manners with engaging conversation, making them perfect for business dinners, social events, or intimate evenings.`,
      faqJson: { questions: [] },
    },
    {
      slug: 'travel-companion',
      url: '/services/travel-companion',
      title: 'Travel Companion Escorts | Business & Leisure | Virel',
      metaDesc: 'International travel companions. Business trip sophistication, vacation elegance. Passport-ready premium companions.',
      h1: 'Travel Companion Escorts',
      content: `Business trips and luxury vacations are enhanced by sophisticated companionship. Our travel companions bring intelligence, adaptability, and discretion to destinations worldwide.`,
      faqJson: { questions: [] },
    },
    {
      slug: 'vip',
      url: '/services/vip',
      title: 'VIP Escorts London | Elite Companions | Virel',
      metaDesc: 'VIP escort services in London. Ultra-exclusive companionship, absolute discretion. Elite verified companions.',
      h1: 'VIP Escorts London',
      content: `Our VIP service represents the absolute pinnacle of premium companionship. With enhanced privacy measures, bespoke arrangements, and our most exclusive companions, VIP services cater to the most discerning clientele.`,
      faqJson: { questions: [] },
    },
  ]
  
  for (const page of servicePages) {
    const created = await prisma.sEOWhitelist.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        type: 'SERVICE',
        ...page,
        isPublished: true,
      },
    })
    console.log('✅ SERVICE page:', created.slug)
  }
  
  // ============================================
  // 4. ATTRIBUTE PAGES (4 attributes) - WHITELIST
  // ============================================
  console.log('\n⭐ Creating ATTRIBUTE whitelist pages (4 attributes)...')
  
  const attributePages = [
    {
      slug: 'blonde-escorts-london',
      url: '/blonde-escorts-london',
      title: 'Blonde Escorts London | Premium Companions | Virel',
      metaDesc: 'London\'s finest blonde companions. Verified, sophisticated, discreet. Platinum, honey, and golden blonde escorts.',
      h1: 'Blonde Escorts in London',
      content: `Our blonde companions represent diverse beauty from platinum Nordic elegance to warm honey tones. Each brings unique personality and sophisticated charm to create unforgettable experiences.`,
      faqJson: { questions: [] },
    },
    {
      slug: 'brunette-escorts-london',
      url: '/brunette-escorts-london',
      title: 'Brunette Escorts London | Premium Companions | Virel',
      metaDesc: 'Sophisticated brunette companions in London. Classic elegance, intelligence, discretion. Verified premium services.',
      h1: 'Brunette Escorts in London',
      content: `Our brunette companions embody classic elegance and sophisticated charm. From rich chocolate to subtle auburn tones, they bring intelligence and style to every encounter.`,
      faqJson: { questions: [] },
    },
    {
      slug: 'petite-escorts-london',
      url: '/petite-escorts-london',
      title: 'Petite Escorts London | Delicate Companions | Virel',
      metaDesc: 'Petite premium companions in London. Delicate beauty, sophisticated charm. Verified escorts under 5\'4".',
      h1: 'Petite Escorts in London',
      content: `Our petite companions combine delicate beauty with dynamic personality. These sophisticated women prove that elegance comes in every size.`,
      faqJson: { questions: [] },
    },
    {
      slug: 'vip-escorts-london',
      url: '/vip-escorts-london',
      title: 'VIP Escorts London | Ultra-Premium | Virel',
      metaDesc: 'Ultra-premium VIP companions. Elite verified escorts, absolute discretion, bespoke arrangements. London\'s finest.',
      h1: 'VIP Escorts London',
      content: `Our VIP companions represent the absolute elite of London's premium companionship scene. With enhanced verification, impeccable presentation, and exceptional sophistication.`,
      faqJson: { questions: [] },
    },
  ]
  
  for (const page of attributePages) {
    const created = await prisma.sEOWhitelist.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        type: 'ATTRIBUTE',
        ...page,
        isPublished: true,
      },
    })
    console.log('✅ ATTRIBUTE page:', created.slug)
  }
  
  console.log('\n✨ Database seed completed successfully!')
  console.log('📊 Created:')
  console.log('  - 6 users (1 admin, 1 manager, 4 reception)')
  console.log('  - 9 GEO pages (London districts)')
  console.log('  - 4 SERVICE pages')
  console.log('  - 4 ATTRIBUTE pages')
  console.log('  Total: 17 SEO whitelist pages ready for indexation')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
