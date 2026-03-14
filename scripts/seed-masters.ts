// SEED MASTERS — Phase 2 reference data
// Creates CallRateMaster, Service (Phase 2 fields), District, TransportHub records
// Run: npx tsx scripts/seed-masters.ts

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const toSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const publicNames: Record<string, string> = {
  'GFE':            'Girlfriend Experience',
  'DFK':            'Deep French Kiss',
  'OWO':            'Oral Without',
  'PSE':            'Pornstar Experience',
  'DUO':            'Duo Available',
  'Bi DUO':         'Bisexual Duo',
  'BDSM':           'BDSM & Bondage',
  'WS giving':      'Water Sports',
  'Rimming giving': 'Rimming',
  'CIM':            'CIM',
  'COB':            'COB',
  'A-Level':        'A-Level',
}

async function main() {
  console.log('Seeding masters...')
  await seedCallRates()
  await seedServices()
  await seedDistricts()
  await seedTransportHubs()
  console.log('Done.')
}

// ─── CallRateMaster (8 records) ──────────────────────────────

async function seedCallRates() {
  const rates = [
    { label: '30 min',            durationMin: 30,  sortOrder: 1 },
    { label: '45 min',            durationMin: 45,  sortOrder: 2 },
    { label: '1 Hour',            durationMin: 60,  sortOrder: 3 },
    { label: '90 min',            durationMin: 90,  sortOrder: 4 },
    { label: '2 Hours',           durationMin: 120, sortOrder: 5 },
    { label: '3 Hours',           durationMin: 180, sortOrder: 6 },
    { label: 'Overnight (9 hrs)', durationMin: 540, sortOrder: 7 },
    { label: 'Extra Hour',        durationMin: 60,  sortOrder: 8 },
  ]

  for (const rate of rates) {
    const existing = await prisma.callRateMaster.findFirst({
      where: { label: rate.label },
    })
    if (existing) {
      await prisma.callRateMaster.update({
        where: { id: existing.id },
        data: rate,
      })
    } else {
      await prisma.callRateMaster.create({ data: rate })
    }
  }
  console.log('CallRateMasters seeded:', rates.length)
}

// ─── Services (82 records) ───────────────────────────────────

async function seedServices() {
  const services = [
    // signature
    { name: 'GFE',                 category: 'signature', isPublic: true,  sortOrder: 1  },
    { name: 'FK',                  category: 'signature', isPublic: true,  sortOrder: 2  },
    { name: 'DFK',                 category: 'signature', isPublic: true,  sortOrder: 3  },
    { name: 'OWO',                 category: 'signature', isPublic: true,  sortOrder: 4  },
    { name: 'PSE',                 category: 'signature', isPublic: true,  sortOrder: 5  },
    { name: 'DUO',                 category: 'signature', isPublic: true,  sortOrder: 6  },
    { name: 'Bi DUO',              category: 'signature', isPublic: true,  sortOrder: 7  },
    { name: 'Couples',             category: 'signature', isPublic: true,  sortOrder: 8  },
    { name: 'Dinner Date',         category: 'signature', isPublic: true,  sortOrder: 9  },
    { name: 'Travel Companion',    category: 'signature', isPublic: true,  sortOrder: 10 },
    { name: 'Overnight Experience', category: 'signature', isPublic: true, sortOrder: 11 },
    { name: 'Striptease',          category: 'signature', isPublic: true,  sortOrder: 12 },
    { name: 'Lapdancing',          category: 'signature', isPublic: true,  sortOrder: 13 },
    { name: 'Roleplay',            category: 'signature', isPublic: true,  sortOrder: 14 },
    { name: 'Shower',              category: 'signature', isPublic: true,  sortOrder: 15 },
    { name: 'Uniform',             category: 'signature', isPublic: true,  sortOrder: 16 },
    { name: 'Dirty Talk',          category: 'signature', isPublic: true,  sortOrder: 17 },
    { name: 'Face Sitting',        category: 'signature', isPublic: true,  sortOrder: 18 },
    { name: 'Fingering',           category: 'signature', isPublic: true,  sortOrder: 19 },
    { name: "Lady's Services",     category: 'signature', isPublic: true,  sortOrder: 20 },
    { name: 'Open minded',         category: 'signature', isPublic: true,  sortOrder: 21 },
    { name: 'Party',               category: 'signature', isPublic: true,  sortOrder: 22 },
    { name: 'Toys',                category: 'signature', isPublic: true,  sortOrder: 23 },
    { name: '69',                  category: 'signature', isPublic: true,  sortOrder: 24 },
    { name: '30 Minute',           category: 'signature', isPublic: true,  sortOrder: 25 },
    { name: 'Massage',             category: 'signature', isPublic: true,  sortOrder: 26 },
    // intimate
    { name: 'CIF',                      category: 'intimate', isPublic: false, sortOrder: 1  },
    { name: 'CIM',                      category: 'intimate', isPublic: false, sortOrder: 2  },
    { name: 'COB',                      category: 'intimate', isPublic: false, sortOrder: 3  },
    { name: 'A-Level',                  category: 'intimate', isPublic: false, sortOrder: 4  },
    { name: 'Swallow',                  category: 'intimate', isPublic: false, sortOrder: 5  },
    { name: 'Snowballing',              category: 'intimate', isPublic: false, sortOrder: 6  },
    { name: 'Rimming giving',           category: 'intimate', isPublic: false, sortOrder: 7  },
    { name: 'Rimming receiving',        category: 'intimate', isPublic: false, sortOrder: 8  },
    { name: 'WS giving',                category: 'intimate', isPublic: false, sortOrder: 9  },
    { name: 'WS receiving',             category: 'intimate', isPublic: false, sortOrder: 10 },
    { name: 'Squirting',                category: 'intimate', isPublic: false, sortOrder: 11 },
    { name: 'Fisting',                  category: 'intimate', isPublic: false, sortOrder: 12 },
    { name: 'DP',                       category: 'intimate', isPublic: false, sortOrder: 13 },
    { name: 'DT',                       category: 'intimate', isPublic: false, sortOrder: 14 },
    { name: 'Deep Throat',              category: 'intimate', isPublic: false, sortOrder: 15 },
    { name: 'Spanking giving',          category: 'intimate', isPublic: false, sortOrder: 16 },
    { name: 'Soft Spanking receiving',   category: 'intimate', isPublic: false, sortOrder: 17 },
    { name: 'Humiliation',              category: 'intimate', isPublic: false, sortOrder: 18 },
    { name: 'Escorts For Girls',         category: 'intimate', isPublic: false, sortOrder: 19 },
    // wellness
    { name: 'Body to Body',         category: 'wellness', isPublic: true, sortOrder: 1 },
    { name: 'Nuru',                  category: 'wellness', isPublic: true, sortOrder: 2 },
    { name: 'Tantric',              category: 'wellness', isPublic: true, sortOrder: 3 },
    { name: 'Sensual',              category: 'wellness', isPublic: true, sortOrder: 4 },
    { name: 'Erotic',               category: 'wellness', isPublic: true, sortOrder: 5 },
    { name: 'Lomilomi',             category: 'wellness', isPublic: true, sortOrder: 6 },
    { name: 'Professional Massage', category: 'wellness', isPublic: true, sortOrder: 7 },
    { name: 'Prostate Massage',     category: 'wellness', isPublic: true, sortOrder: 8 },
    // fetish
    { name: 'BDSM',               category: 'fetish', isPublic: true, sortOrder: 1  },
    { name: 'Domination',         category: 'fetish', isPublic: true, sortOrder: 2  },
    { name: 'Light Domination',   category: 'fetish', isPublic: true, sortOrder: 3  },
    { name: 'Foot Fetish',        category: 'fetish', isPublic: true, sortOrder: 4  },
    { name: 'Strap-on',           category: 'fetish', isPublic: true, sortOrder: 5  },
    { name: 'Smoking Fetish',     category: 'fetish', isPublic: true, sortOrder: 6  },
    { name: 'Handcuffs',          category: 'fetish', isPublic: true, sortOrder: 7  },
    { name: 'Tie and Tease',      category: 'fetish', isPublic: true, sortOrder: 8  },
    { name: 'Poppers',            category: 'fetish', isPublic: true, sortOrder: 9  },
    { name: 'Latex',               category: 'fetish', isPublic: true, sortOrder: 10 },
    { name: 'Bondage',            category: 'fetish', isPublic: true, sortOrder: 11 },
    { name: 'Rope Bondage',       category: 'fetish', isPublic: true, sortOrder: 12 },
    { name: 'Ball Busting',       category: 'fetish', isPublic: true, sortOrder: 13 },
    { name: 'Caning',             category: 'fetish', isPublic: true, sortOrder: 14 },
    { name: 'Cuckolding',         category: 'fetish', isPublic: true, sortOrder: 15 },
    { name: 'Slapping',           category: 'fetish', isPublic: true, sortOrder: 16 },
    { name: 'Trampling',          category: 'fetish', isPublic: true, sortOrder: 17 },
    { name: 'Sensual Wrestling',  category: 'fetish', isPublic: true, sortOrder: 18 },
    { name: 'Fetish',             category: 'fetish', isPublic: true, sortOrder: 19 },
    // bespoke
    { name: 'MMF',                    category: 'bespoke', isPublic: false, sortOrder: 1 },
    { name: 'Group',                  category: 'bespoke', isPublic: false, sortOrder: 2 },
    { name: 'Filming with mask',      category: 'bespoke', isPublic: false, sortOrder: 3 },
    { name: 'Filming WITHOUT mask',   category: 'bespoke', isPublic: false, sortOrder: 4 },
    { name: 'Photos With Mask',       category: 'bespoke', isPublic: false, sortOrder: 5 },
  ]

  for (const s of services) {
    const slug = toSlug(s.name)
    await prisma.service.upsert({
      where: { name: s.name },
      update: { ...s, slug, publicName: publicNames[s.name] ?? null },
      create: {
        ...s,
        slug,
        title: s.name,
        publicName: publicNames[s.name] ?? null,
      },
    })
  }
  console.log('Services seeded:', services.length)
}

// ─── Districts (25 records) ──────────────────────────────────

async function seedDistricts() {
  const districts = [
    // Tier 1
    {
      name: 'Mayfair', slug: 'mayfair', tier: 1, isPopular: true, sortOrder: 1,
      seoTitle: 'Companions in Mayfair | Virel London',
      hotels: ['The Dorchester', "Claridge's", 'The Connaught', '45 Park Lane', 'Grosvenor House'],
      restaurants: ['Nobu Mayfair', "Scott's", 'Sexy Fish', 'Benares', 'Gymkhana'],
      landmarks: ['Berkeley Square', 'Grosvenor Square', 'Bond Street'],
    },
    {
      name: 'Knightsbridge', slug: 'knightsbridge', tier: 1, isPopular: true, sortOrder: 2,
      seoTitle: 'Companions in Knightsbridge | Virel London',
      hotels: ['Mandarin Oriental', 'The Bulgari Hotel', 'The Beaumont', 'Egerton House', 'The Capital'],
      restaurants: ['Dinner by Heston', 'Bar Boulud', 'Zuma', 'Amaya', 'Mr Chow'],
      landmarks: ['Harrods', 'Hyde Park', 'Harvey Nichols'],
    },
    {
      name: 'Chelsea', slug: 'chelsea', tier: 1, isPopular: true, sortOrder: 3,
      seoTitle: 'Companions in Chelsea | Virel London',
      hotels: ['The Sloane Club', 'Blakes Hotel', 'Sydney House Chelsea', 'The Cadogan', 'Artist Residence'],
      restaurants: ["Outlaw's at The Capital", 'Medlar', 'Colbert', 'The Ivy Chelsea Garden', 'Rabbit'],
      landmarks: ["King's Road", 'Chelsea Physic Garden', 'Saatchi Gallery'],
    },
    {
      name: 'Kensington', slug: 'kensington', tier: 1, isPopular: true, sortOrder: 4,
      seoTitle: 'Companions in Kensington | Virel London',
      hotels: ['The Milestone Hotel', 'Royal Garden Hotel', 'Baglioni Hotel', 'Kensington Palace Hotel', 'The Gore'],
      restaurants: ["Clarke's", 'Babylon', 'Min Jiang', 'Launceston Place', 'Kitchen W8'],
      landmarks: ['Kensington Palace', 'Holland Park', 'Design Museum'],
    },
    {
      name: 'South Kensington', slug: 'south-kensington', tier: 1, isPopular: true, sortOrder: 5,
      seoTitle: 'Companions in South Kensington | Virel London',
      hotels: ['The Exhibitionist', 'Number Sixteen', 'The Cranley', 'Ampersand Hotel', 'Aster House'],
      restaurants: ['Daquise', 'Brasserie Gustave', 'Cambio de Tercio', 'Tendido Cero', "Ziani's"],
      landmarks: ['Natural History Museum', 'Victoria & Albert Museum', 'Science Museum'],
    },
    {
      name: 'Belgravia', slug: 'belgravia', tier: 1, isPopular: true, sortOrder: 6,
      seoTitle: 'Companions in Belgravia | Virel London',
      hotels: ['The Lanesborough', 'Amba Hotel Marble Arch', 'B+B Belgravia', 'The Eccleston Square Hotel', 'Lime Tree Hotel'],
      restaurants: ['Petrus', 'Amesta', 'Ebury Restaurant', 'Thomas Cubitt', "Motcomb's"],
      landmarks: ['Belgravia Square', 'Eaton Square', 'Chester Square'],
    },
    {
      name: 'Notting Hill', slug: 'notting-hill', tier: 1, isPopular: true, sortOrder: 7,
      seoTitle: 'Companions in Notting Hill | Virel London',
      hotels: ['The Portobello Hotel', 'Hillgate Place', 'The Main House', 'Guesthouse West', 'Vancouver Studios'],
      restaurants: ['The Ledbury', 'Ottolenghi', 'Flat Iron Square', 'Bumpkin', 'Electric Diner'],
      landmarks: ['Portobello Road Market', 'Notting Hill Gate', 'Electric Cinema'],
    },
    {
      name: 'Sloane Square', slug: 'sloane-square', tier: 1, isPopular: true, sortOrder: 8,
      seoTitle: 'Companions in Sloane Square | Virel London',
      hotels: ['The Cadogan', 'Sloane Square Hotel', 'Knightsbridge Hotel', 'The Beaufort', 'San Domenico House'],
      restaurants: ['Colbert', 'The Botanist', 'Rabbit', 'Bluebird', 'Cote Brasserie'],
      landmarks: ['Sloane Square', 'Duke of York Square', 'Royal Court Theatre'],
    },
    {
      name: 'Marylebone', slug: 'marylebone', tier: 1, isPopular: true, sortOrder: 9,
      seoTitle: 'Companions in Marylebone | Virel London',
      hotels: ['The Marylebone Hotel', 'Mandeville Hotel', 'Doyle Collection', 'Hart Shoreditch', 'The Zetter Townhouse'],
      restaurants: ['Chiltern Firehouse', 'Orrery', 'The Providores', 'Lurra', 'Donostia'],
      landmarks: ['Marylebone High Street', "Regent's Park", 'Sherlock Holmes Museum'],
    },
    {
      name: 'Soho', slug: 'soho', tier: 1, isPopular: true, sortOrder: 10,
      seoTitle: 'Companions in Soho | Virel London',
      hotels: ['Ham Yard Hotel', 'Soho Hotel', 'Dean Street Townhouse', "Kettner's Townhouse", 'The Curtain'],
      restaurants: ['Bao', 'Kiln', 'Barrafina', 'Bocca di Lupo', 'Yauatcha'],
      landmarks: ['Carnaby Street', 'Soho Square', "Ronnie Scott's Jazz Club"],
    },
    // Tier 2
    {
      name: 'Victoria', slug: 'victoria', tier: 2, isPopular: false, sortOrder: 11,
      seoTitle: 'Companions in Victoria | Virel London',
      hotels: ['Goring Hotel', "St Ermin's Hotel", 'Crowne Plaza London', 'Taj 51 Buckingham Gate', 'B+B Belgravia'],
      restaurants: ['Quilon', 'The Cinnamon Club', 'Zander', "Osteria Dell'Angelo", 'Thomas Cubitt'],
      landmarks: ['Buckingham Palace', 'Victoria Station', 'Westminster Cathedral'],
    },
    {
      name: 'Westminster', slug: 'westminster', tier: 2, isPopular: false, sortOrder: 12,
      seoTitle: 'Companions in Westminster | Virel London',
      hotels: ['Conrad London St James', 'Taj 51 Buckingham Gate', 'Amba Hotel Victoria', 'Sanctuary House Hotel', 'Rochester Hotel'],
      restaurants: ['The Cinnamon Club', 'Roux at Parliament Square', 'Boisdale of Belgravia', "Osteria Dell'Angelo", 'The Rex Whistler'],
      landmarks: ['Houses of Parliament', 'Westminster Abbey', "St James's Park"],
    },
    {
      name: 'Covent Garden', slug: 'covent-garden', tier: 2, isPopular: false, sortOrder: 13,
      seoTitle: 'Companions in Covent Garden | Virel London',
      hotels: ['Covent Garden Hotel', 'ME London', 'One Aldwych', 'The Henrietta Hotel', 'Rosewood London'],
      restaurants: ['The Ivy', 'J Sheekey', 'Clos Maggiore', 'Rules', 'Balthazar'],
      landmarks: ['Covent Garden Piazza', 'Royal Opera House', 'Seven Dials'],
    },
    {
      name: 'Paddington', slug: 'paddington', tier: 2, isPopular: false, sortOrder: 14,
      seoTitle: 'Companions in Paddington | Virel London',
      hotels: ['Hilton London Paddington', 'Shaftesbury Paddington Court', 'Stylotel', 'Park Grand Paddington', 'The Hempel'],
      restaurants: ['Angelus', 'Kateh', "Raoul's", 'Pearl Liang', 'Craven Road Restaurant'],
      landmarks: ['Paddington Station', 'Hyde Park', 'Little Venice'],
    },
    {
      name: 'Bayswater', slug: 'bayswater', tier: 2, isPopular: false, sortOrder: 15,
      seoTitle: 'Companions in Bayswater | Virel London',
      hotels: ['Hempel Garden Square', 'London Guards Hotel', 'Park International Hotel', 'Zeus Hotel', 'Pavilion Hotel'],
      restaurants: ['Hereford Road', 'Ottolenghi Notting Hill', 'La Bottega', 'Aphrodite Taverna', 'Tawana'],
      landmarks: ['Hyde Park', 'Kensington Gardens', 'Queensway'],
    },
    {
      name: 'Earls Court', slug: 'earls-court', tier: 2, isPopular: false, sortOrder: 16,
      seoTitle: 'Companions in Earls Court | Virel London',
      hotels: ['K+K Hotel George', 'Comfort Inn Earls Court', 'Ibis London Earls Court', 'Barkston Gardens Hotel', 'The Rockwell'],
      restaurants: ['Tendido Cero', "Maggie Jones's", 'Lou Pescadou', 'Troubadour Cafe', "Pemberton's"],
      landmarks: ['Earls Court Exhibition Centre', 'Holland Park', 'Brompton Cemetery'],
    },
    {
      name: 'Gloucester Road', slug: 'gloucester-road', tier: 2, isPopular: false, sortOrder: 17,
      seoTitle: 'Companions in Gloucester Road | Virel London',
      hotels: ['The Exhibitionist', 'Copthorne Tara Hotel', 'Millennium Gloucester Hotel', 'Base2Stay', 'Hotel Xenia'],
      restaurants: ['Cambio de Tercio', 'Launceston Place', 'Racine', 'Pappa Ciccia', 'Ognisko'],
      landmarks: ['Natural History Museum', 'Hyde Park', 'French Institute'],
    },
    {
      name: 'Fulham', slug: 'fulham', tier: 2, isPopular: false, sortOrder: 18,
      seoTitle: 'Companions in Fulham | Virel London',
      hotels: ['Parsons Green Hotel', 'The Fulham Town House', 'Best Western Fulham', 'Ibis London Earls Court', 'Twenty Nevern Square'],
      restaurants: ['The River Cafe', 'Harwood Arms', 'Blue Elephant', 'The Farm', "Claude's Kitchen"],
      landmarks: ['Fulham Palace', 'Craven Cottage', "Bishop's Park"],
    },
    {
      name: 'Hyde Park', slug: 'hyde-park', tier: 2, isPopular: false, sortOrder: 19,
      seoTitle: 'Companions near Hyde Park | Virel London',
      hotels: ['The Halkin', 'InterContinental London Park Lane', 'The Londoner', 'The Cumberland', 'Marriott Grosvenor Square'],
      restaurants: ['Brasserie at The Dorchester', 'Theo Randall', 'Windows Restaurant', 'Galvin at Windows', "Corrigan's Mayfair"],
      landmarks: ['Hyde Park', 'Serpentine Gallery', "Speaker's Corner"],
    },
    {
      name: 'Marble Arch', slug: 'marble-arch', tier: 2, isPopular: false, sortOrder: 20,
      seoTitle: 'Companions near Marble Arch | Virel London',
      hotels: ['Hyatt Regency London', 'The Cumberland', 'Radisson Blu Portman', 'Montcalm London', 'Park Lane Hotel'],
      restaurants: ['Ristorante Italiano', 'The Brass Rail', 'Levant', 'Dinings SW3', 'Locanda Locatelli'],
      landmarks: ['Marble Arch', 'Hyde Park', 'Oxford Street'],
    },
    // Tier 3
    {
      name: 'Canary Wharf', slug: 'canary-wharf', tier: 3, isPopular: false, sortOrder: 21,
      seoTitle: 'Companions in Canary Wharf | Virel London',
      hotels: ['Four Seasons Canary Wharf', 'Hilton Canary Wharf', 'Radisson Blu Edwardian', 'Novotel Canary Wharf', 'Marriott West India Quay'],
      restaurants: ['Plateau', 'Roka Canary Wharf', 'Boisdale Canary Wharf', 'Hawksmoor', 'Gaucho Canary Wharf'],
      landmarks: ['One Canada Square', 'Museum of London Docklands', 'Crossrail Place Roof Garden'],
    },
    {
      name: 'Shoreditch', slug: 'shoreditch', tier: 3, isPopular: false, sortOrder: 22,
      seoTitle: 'Companions in Shoreditch | Virel London',
      hotels: ['The Curtain', 'Ace Hotel London', 'Hoxton Hotel Shoreditch', 'Boundary London', 'QBIC Hotel'],
      restaurants: ["Lyle's", 'Smoking Goat', 'Brat', 'St John Bread & Wine', 'Dishoom Shoreditch'],
      landmarks: ['Brick Lane', 'Spitalfields Market', 'Columbia Road Flower Market'],
    },
    {
      name: 'Battersea', slug: 'battersea', tier: 3, isPopular: false, sortOrder: 23,
      seoTitle: 'Companions in Battersea | Virel London',
      hotels: ['Battersea Power Station Hotel', 'Park Grand London Heathrow', 'Premier Inn Battersea', 'Wyndham Grand Chelsea Harbour', 'The Candlewood Suites'],
      restaurants: ['Chez Bruce', 'Bistro Union', 'Numero Uno', 'Riva', 'Brunswick House'],
      landmarks: ['Battersea Power Station', 'Battersea Park', 'Chelsea Bridge'],
    },
    {
      name: 'Maida Vale', slug: 'maida-vale', tier: 3, isPopular: false, sortOrder: 24,
      seoTitle: 'Companions in Maida Vale | Virel London',
      hotels: ['The Colonnade', 'Colonnade Town House', 'Paddington Waterside Hotel', 'Hampton by Hilton Waterloo', 'Hilton London Metropole'],
      restaurants: ["Raoul's Cafe", 'Truscott Arms', 'The Warwick', 'Lauderdale House', "Jason's Canalside"],
      landmarks: ['Little Venice', "Regent's Canal", 'BBC Maida Vale Studios'],
    },
    {
      name: 'St Johns Wood', slug: 'st-johns-wood', tier: 3, isPopular: false, sortOrder: 25,
      seoTitle: 'Companions in St Johns Wood | Virel London',
      hotels: ['InterContinental London Park Lane', 'Danubius Hotel Regents Park', 'Landmark London', 'Sherlock Holmes Hotel', 'Lincoln House Hotel'],
      restaurants: ['The Clifton', "L'Aventure", 'Sardo Canale', 'The Salt House', 'Richoux'],
      landmarks: ['Abbey Road Studios', "Lord's Cricket Ground", "Regent's Park"],
    },
  ]

  for (const d of districts) {
    await prisma.district.upsert({
      where: { slug: d.slug },
      update: d,
      create: d,
    })
  }
  console.log('Districts seeded:', districts.length)
}

// ─── TransportHubs (20 records) ──────────────────────────────

async function seedTransportHubs() {
  const hubs = [
    // Mayfair
    { name: 'Bond Street',      slug: 'bond-street',              districtSlug: 'mayfair',       walkingMinutes: 3 },
    { name: 'Green Park',       slug: 'green-park',               districtSlug: 'mayfair',       walkingMinutes: 4 },
    { name: 'Oxford Circus',    slug: 'oxford-circus',            districtSlug: 'mayfair',       walkingMinutes: 6 },
    // Knightsbridge
    { name: 'Hyde Park Corner', slug: 'hyde-park-corner',         districtSlug: 'knightsbridge', walkingMinutes: 2 },
    { name: 'Knightsbridge',    slug: 'knightsbridge-station',    districtSlug: 'knightsbridge', walkingMinutes: 3 },
    // Chelsea
    { name: 'Sloane Square',    slug: 'sloane-square',            districtSlug: 'chelsea',       walkingMinutes: 2 },
    { name: 'South Kensington', slug: 'south-kensington-station', districtSlug: 'chelsea',       walkingMinutes: 4 },
    // Soho
    { name: 'Leicester Square', slug: 'leicester-square',         districtSlug: 'soho',          walkingMinutes: 3 },
    { name: 'Piccadilly Circus', slug: 'piccadilly-circus',       districtSlug: 'soho',          walkingMinutes: 4 },
    // Victoria
    { name: 'Victoria',         slug: 'victoria',                 districtSlug: 'victoria',      walkingMinutes: 3 },
    { name: 'Pimlico',          slug: 'pimlico',                  districtSlug: 'victoria',      walkingMinutes: 5 },
    // Paddington
    { name: 'Paddington',       slug: 'paddington',               districtSlug: 'paddington',    walkingMinutes: 2 },
    { name: 'Royal Oak',        slug: 'royal-oak',                districtSlug: 'paddington',    walkingMinutes: 4 },
    // Canary Wharf
    { name: 'Canary Wharf',     slug: 'canary-wharf-station',     districtSlug: 'canary-wharf',  walkingMinutes: 3 },
    { name: 'Heron Quays',      slug: 'heron-quays',              districtSlug: 'canary-wharf',  walkingMinutes: 4 },
    // Shoreditch
    { name: 'Liverpool Street', slug: 'liverpool-street',         districtSlug: 'shoreditch',    walkingMinutes: 5 },
    { name: 'Aldgate',          slug: 'aldgate',                  districtSlug: 'shoreditch',    walkingMinutes: 6 },
    // Marylebone
    { name: 'Baker Street',     slug: 'baker-street',             districtSlug: 'marylebone',    walkingMinutes: 4 },
    // Notting Hill
    { name: 'Notting Hill Gate', slug: 'notting-hill-gate',       districtSlug: 'notting-hill',  walkingMinutes: 3 },
    // Covent Garden
    { name: 'Covent Garden',    slug: 'covent-garden-station',    districtSlug: 'covent-garden', walkingMinutes: 2 },
  ]

  for (const h of hubs) {
    const district = await prisma.district.findUnique({ where: { slug: h.districtSlug } })
    if (!district) {
      console.warn(`District not found for hub: ${h.name} (${h.districtSlug})`)
      continue
    }
    const { districtSlug, ...data } = h
    await prisma.transportHub.upsert({
      where: { slug: data.slug },
      update: { ...data, districtId: district.id },
      create: { ...data, districtId: district.id },
    })
  }
  console.log('TransportHubs seeded:', hubs.length)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
