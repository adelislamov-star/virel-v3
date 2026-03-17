/* ------------------------------------------------------------------ *
 *  District-specific content overrides.                               *
 *  When a district slug has an entry here the generic template text   *
 *  is replaced with bespoke copy.                                     *
 * ------------------------------------------------------------------ */

export interface DistrictFaq {
  q: string
  /** May contain <a href="...">text</a> — rendered as Next.js Link */
  a: string
}

export interface DistrictContent {
  metaDescription?: string
  aboutParagraphs?: string[]
  /** Paragraphs with <a href> tags, rendered after the profiles grid */
  standardTextParagraphs?: string[]
  hotels?: string[]
  restaurants?: string[]
  /** Single string with <a href> tags for nearby areas prose */
  nearbyText?: string
  faq?: DistrictFaq[]
  ctaText?: string
}

export const districtContent: Record<string, DistrictContent> = {
  /* ---------------------------------------------------------------- */
  /*  1. MAYFAIR                                                       */
  /* ---------------------------------------------------------------- */
  mayfair: {
    metaDescription:
      'Private companion agency in Mayfair, London. Verified ladies available for dinner dates, overnight arrangements and travel. Incall and outcall. Response within 30 minutes.',
    aboutParagraphs: [
      'Mayfair occupies a particular place in London\u2019s geography \u2014 not simply a postcode, but a register. Its streets were laid out for those who understood that distinction lies not in display, but in quality of life. The Georgian townhouses, the quiet garden squares, the doormen who remember names \u2014 everything here is calibrated to a certain standard.',
      'The area runs from Park Lane to Regent Street, bounded to the north by Oxford Street and to the south by Piccadilly. Within this rectangle sits the greatest concentration of five-star hotels in Europe: The Dorchester, Claridge\u2019s, The Connaught, 45 Park Lane. The restaurants follow the same logic \u2014 Scott\u2019s on Mount Street, Nobu on Old Park Lane, Gymkhana on Albemarle Street.',
      'This is where our companions spend their evenings. Not performing luxury \u2014 inhabiting it.',
    ],
    standardTextParagraphs: [
      'We represent a small number of ladies who meet a specific standard \u2014 in presentation, in conversation, in the ability to move through Mayfair without effort. Every companion has been personally introduced to our team. The photographs on their profiles are genuine.',
      'Our <a href="/categories/gfe">GFE companions in Mayfair</a> are available for unhurried evenings. For a reservation at Scott\u2019s or Gymkhana, our <a href="/services/dinner-date">dinner date companions</a> know the room. Those staying at The Dorchester or Claridge\u2019s will find <a href="/services/outcall">outcall arrangements</a> handled without complication.',
      'When you contact us about Mayfair, we respond within thirty minutes. <a href="/services/incall">Incall</a> appointments are available at a private central London address. <a href="/services/outcall">Outcall</a> covers all major Mayfair hotels. Rates begin from \u00a3300 per hour. Our <a href="/verification">verification process</a> and <a href="/discretion">discretion standards</a> are described in full on their respective pages.',
    ],
    hotels: ['The Dorchester', 'Claridge\u2019s', 'The Connaught', '45 Park Lane', 'Grosvenor House', 'The Beaumont'],
    restaurants: ['Scott\u2019s', 'Nobu Mayfair', 'Sexy Fish', 'Gymkhana', 'Benares', 'The Connaught Bar'],
    nearbyText:
      'Mayfair borders <a href="/london/knightsbridge-escorts/">Knightsbridge</a> to the south-west \u2014 home to the Mandarin Oriental and Bulgari Hotel. <a href="/london/belgravia-escorts/">Belgravia</a> lies directly south: quieter, more residential, equally discreet. <a href="/london/marylebone-escorts/">Marylebone</a> sits to the north, with the boutique hotels of Chiltern Street. <a href="/london/soho-escorts/">Soho</a> is fifteen minutes east \u2014 a different mood entirely, for those who want one.',
    faq: [
      { q: 'Are companions available in Mayfair tonight?', a: 'Yes. We maintain availability across Mayfair seven days a week. Contact us via Telegram or email and we confirm within thirty minutes. Same-day bookings are accommodated when companions are available.' },
      { q: 'Do you offer outcall to Mayfair hotels?', a: 'Yes \u2014 The Dorchester, Claridge\u2019s, The Connaught, 45 Park Lane, The Beaumont and all other hotels in the area. Outcall rates are listed on individual companion profiles.' },
      { q: 'What is the minimum booking duration?', a: 'Most companions accept bookings from thirty minutes. For dinner dates or evening arrangements, two hours allows the evening to develop naturally.' },
      { q: 'How is discretion handled?', a: 'We do not discuss client details with third parties. Communications are conducted through secure channels. Full details on our <a href="/discretion">discretion page</a>.' },
      { q: 'What happens after I make contact?', a: 'You send a message via Telegram or email. We respond within thirty minutes with a suggestion of one or two companions. If the introduction is right, we confirm the appointment. Straightforward, no unnecessary exchange.' },
    ],
    ctaText: 'Available tonight in Mayfair. Thirty-minute response.',
  },

  /* ---------------------------------------------------------------- */
  /*  2. KNIGHTSBRIDGE                                                 */
  /* ---------------------------------------------------------------- */
  knightsbridge: {
    metaDescription:
      'Private companion agency in Knightsbridge, London. Verified ladies for dinner dates, hotel visits and overnight arrangements. Incall and outcall. 30-minute response.',
    aboutParagraphs: [
      'Knightsbridge sits between Hyde Park and Belgravia \u2014 one of the most quietly affluent stretches of London. It is not a neighbourhood that announces itself. The residential streets behind Brompton Road are some of the most expensive addresses in the country, and they look it: white stucco, private gardens, residents who value proximity to the park over proximity to anything else.',
      'The commercial identity is equally restrained. Harrods occupies an entire block on Brompton Road but its serious clientele tends to know exactly what it came for. Harvey Nichols on Sloane Street is smaller, sharper. The restaurants that matter here are not the ones with the longest queues \u2014 Marcus at The Berkeley, Bar Boulud, Zuma on Raphael Street.',
      'For those staying at the Mandarin Oriental on Hyde Park or the Bulgari on Knightsbridge itself, the standard expected of an evening\u2019s companion is high. We understand that.',
    ],
    standardTextParagraphs: [
      'Our ladies available in Knightsbridge are accustomed to this environment. <a href="/services/outcall">Outcall</a> to the Mandarin Oriental, Bulgari Hotel and all Knightsbridge addresses is available seven days a week. <a href="/services/incall">Incall</a> appointments are at a private central London address.',
      'For an unhurried evening, our <a href="/categories/gfe">GFE companions</a> are suited to the pace of Knightsbridge. For dinner at Zuma or Marcus, our <a href="/services/dinner-date">dinner date companions</a> are the right introduction.',
    ],
    hotels: ['Mandarin Oriental Hyde Park', 'Bulgari Hotel London', 'The Berkeley', 'The Capital Hotel', 'Aster House'],
    restaurants: ['Zuma', 'Marcus', 'Bar Boulud', 'Dinner by Heston Blumenthal', 'Outlaw\u2019s at The Capital'],
    nearbyText:
      '<a href="/london/mayfair-escorts/">Mayfair</a> is ten minutes north-east \u2014 the greatest concentration of five-star hotels in Europe. <a href="/london/chelsea-escorts/">Chelsea</a> lies to the south-west along the King\u2019s Road. <a href="/london/belgravia-escorts/">Belgravia</a> is directly east: quieter, more residential. <a href="/london/south-kensington-escorts/">South Kensington</a> is five minutes west, with its own set of serious restaurants.',
    faq: [
      { q: 'Are companions available in Knightsbridge tonight?', a: 'Yes. We respond within thirty minutes. Same-day bookings available when companions are free.' },
      { q: 'Do you offer outcall to Knightsbridge hotels?', a: 'Yes, including the Mandarin Oriental Hyde Park and Bulgari Hotel. Outcall rates are listed on individual companion profiles.' },
      { q: 'What is the minimum booking?', a: 'Thirty minutes for most companions. Two hours recommended for evening arrangements.' },
      { q: 'How is discretion handled?', a: 'We do not discuss client details with third parties. Full details on our <a href="/discretion">discretion page</a>.' },
    ],
    ctaText: 'Available tonight in Knightsbridge. Thirty-minute response.',
  },

  /* ---------------------------------------------------------------- */
  /*  3. CHELSEA                                                       */
  /* ---------------------------------------------------------------- */
  chelsea: {
    metaDescription:
      'Companion agency in Chelsea, London. Verified ladies for dinner dates, overnight stays and private appointments. Incall and outcall from \u00a3300/hr.',
    aboutParagraphs: [
      'Chelsea has two registers, and they rarely overlap. The first is the King\u2019s Road \u2014 commercial, populated by a crowd that wants to be seen spending. The second is the residential Chelsea behind it: Cheyne Walk along the Embankment, the quiet streets between the King\u2019s Road and the river, the houses that have been in the same families for decades.',
      'Our companions in Chelsea belong to the second register. The area around Sloane Square and the streets leading toward Pimlico have their own tempo \u2014 unhurried, considered. The restaurants worth knowing are Rabbit on King\u2019s Road, Colbert on Sloane Square, and Bluebird for longer lunches. For something quieter, the Wyndham Grand sits directly on the Chelsea Embankment.',
      'This is a neighbourhood for those who know London well enough to have moved past the obvious choices.',
    ],
    standardTextParagraphs: [
      '<a href="/services/outcall">Outcall</a> to Chelsea addresses and hotels is straightforward. <a href="/services/incall">Incall</a> is available centrally. For longer arrangements \u2014 <a href="/services/overnight-stay">overnight</a> or multi-day \u2014 speak to our team directly. Our <a href="/services/travel-companion">travel companions</a> are available for arrangements that extend beyond London.',
    ],
    hotels: ['Wyndham Grand Chelsea Harbour', 'Sydney House Chelsea', 'Sloane Square Hotel'],
    restaurants: ['Colbert', 'Bluebird', 'Rabbit', 'Medlar', 'Brasserie Gustave'],
    nearbyText:
      '<a href="/london/knightsbridge-escorts/">Knightsbridge</a> is five minutes north-east. <a href="/london/south-kensington-escorts/">South Kensington</a> is directly north. <a href="/london/sloane-square-escorts/">Sloane Square</a> connects Chelsea to Belgravia. <a href="/london/fulham-escorts/">Fulham</a> lies to the west along the river.',
    faq: [
      { q: 'Are companions available in Chelsea tonight?', a: 'Yes, seven days a week with thirty-minute response.' },
      { q: 'Do you cover King\u2019s Road and the Embankment?', a: 'Yes, all Chelsea addresses including Chelsea Harbour.' },
      { q: 'What types of arrangements are available?', a: 'Incall, outcall, dinner date, overnight, travel. See individual profiles for availability and rates.' },
    ],
    ctaText: 'Available tonight in Chelsea. Thirty-minute response.',
  },

  /* ---------------------------------------------------------------- */
  /*  4. KENSINGTON                                                    */
  /* ---------------------------------------------------------------- */
  kensington: {
    metaDescription:
      'Companion agency in Kensington, London. Private, verified ladies for hotel visits, dinner dates and longer arrangements. Response within 30 minutes.',
    aboutParagraphs: [
      'Kensington is the kind of address that requires no explanation to those who understand London. The Royal Borough designation describes a standard that the neighbourhood has maintained for well over a century. Kensington Palace anchors the western end of Kensington Gardens; the Natural History Museum and Victoria & Albert define the southern edge.',
      'The hotels here tend toward the grand and the quietly serious. The Royal Garden on Kensington High Street looks directly over Hyde Park. Baglioni on Hyde Park Gate applies Italian sensibility to English grandeur. The Milestone on Kensington Court is smaller, more personal.',
      'For dining, Kitchen W8 on Abingdon Road is a neighbourhood restaurant of real quality. Mazi on Hillgate Street for Greek. Yashin Ocean House on Old Brompton Road for Japanese.',
    ],
    standardTextParagraphs: [
      'Our companions available in Kensington understand the area\u2019s particular tone. <a href="/services/outcall">Outcall</a> to all Kensington hotels and private addresses. <a href="/services/incall">Incall</a> centrally. For <a href="/services/overnight-stay">overnight arrangements</a> or longer stays, rates and availability on individual profiles.',
    ],
    hotels: ['The Royal Garden Hotel', 'Baglioni Hotel London', 'The Milestone Hotel', 'Copthorne Tara'],
    restaurants: ['Kitchen W8', 'Mazi', 'Yashin Ocean House', 'Clarke\u2019s', 'Babylon at The Roof Gardens'],
    nearbyText:
      '<a href="/london/mayfair-escorts/">Mayfair</a> is twenty minutes east. <a href="/london/notting-hill-escorts/">Notting Hill</a> lies to the north-west. <a href="/london/south-kensington-escorts/">South Kensington</a> is directly south. <a href="/london/chelsea-escorts/">Chelsea</a> is accessible along Old Brompton Road.',
    faq: [
      { q: 'Are companions available in Kensington tonight?', a: 'Yes. We respond within thirty minutes seven days a week.' },
      { q: 'Do you cover the Royal Garden Hotel and Baglioni?', a: 'Yes, and all other Kensington hotels and private addresses.' },
      { q: 'What is the minimum booking?', a: 'Thirty minutes for most companions. Two hours for evening arrangements.' },
    ],
    ctaText: 'Available tonight in Kensington. Thirty-minute response.',
  },

  /* ---------------------------------------------------------------- */
  /*  5. BELGRAVIA                                                     */
  /* ---------------------------------------------------------------- */
  belgravia: {
    metaDescription:
      'Companion agency in Belgravia, London. Discreet, verified ladies for private appointments and hotel visits. Incall and outcall. 30-minute response.',
    aboutParagraphs: [
      'Belgravia is the quietest of London\u2019s wealthy neighbourhoods, and deliberately so. The white stucco terraces of Eaton Square and Belgrave Square were designed in the 1820s with a specific resident in mind \u2014 someone who wanted the city\u2019s advantages without its noise. Nearly two centuries later, the formula has not changed.',
      'There are no tourist attractions in Belgravia. No landmark that would draw a crowd. What it has instead is an almost complete absence of disruption: private gardens, streets that see more black cars than pedestrians, restaurants that do not need to advertise. The Lanesborough at Hyde Park Corner is the area\u2019s landmark hotel. The Halkin on Halkin Street is managed with Swiss precision.',
      'For dinner, Petrus on Kinnerton Street is Gordon Ramsay\u2019s most restrained address. Zafferano on Lowndes Street has been feeding Belgravia residents for thirty years. The Pantechnicon on Motcomb Street is better suited to lunch.',
    ],
    standardTextParagraphs: [
      'Discretion in Belgravia is not a feature \u2014 it is the baseline. Our <a href="/discretion">discretion standards</a> and <a href="/verification">verification process</a> exist precisely for clients in neighbourhoods like this. <a href="/services/outcall">Outcall</a> to The Lanesborough, The Halkin, and all private Belgravia addresses. <a href="/services/incall">Incall</a> at a private central address.',
    ],
    hotels: ['The Lanesborough', 'The Halkin by Como', 'B+B Belgravia'],
    restaurants: ['Petrus', 'Zafferano', 'The Pantechnicon', 'Amesta with Arzak Instruction'],
    nearbyText:
      '<a href="/london/mayfair-escorts/">Mayfair</a> is directly north. <a href="/london/chelsea-escorts/">Chelsea</a> lies to the west. <a href="/london/victoria-escorts/">Victoria</a> is five minutes south. <a href="/london/knightsbridge-escorts/">Knightsbridge</a> is accessible along Sloane Street.',
    faq: [
      { q: 'Are companions available in Belgravia tonight?', a: 'Yes. We respond within thirty minutes. Belgravia bookings are handled with the same level of discretion as the neighbourhood itself.' },
      { q: 'Do you offer outcall to The Lanesborough and The Halkin?', a: 'Yes, and to all private Belgravia addresses.' },
      { q: 'How is discretion handled in Belgravia?', a: 'We do not discuss client details. No records beyond scheduling. Full details on our <a href="/discretion">discretion page</a>.' },
    ],
    ctaText: 'Available tonight in Belgravia. Thirty-minute response.',
  },

  /* ---------------------------------------------------------------- */
  /*  6. SOUTH KENSINGTON                                              */
  /* ---------------------------------------------------------------- */
  'south-kensington': {
    metaDescription:
      'Companion agency in South Kensington, London. Verified ladies for private appointments, hotel visits and dinner dates. Available now.',
    aboutParagraphs: [
      'South Kensington occupies the space between the museums and the money. To the north, the Natural History Museum, Science Museum and V&A form one of the world\u2019s great museum quarters. To the south and west, the residential streets around Onslow Square and Old Brompton Road house a population that is consistently international, consistently affluent.',
      'The French connection is well established \u2014 the Lyc\u00e9e Fran\u00e7ais, the Consulat G\u00e9n\u00e9ral, and decades of French residents have given the neighbourhood a particular character. The restaurants along Old Brompton Road reflect this: Brasserie Thurloe, and L\u2019Etranger on Gloucester Road for something more ambitious.',
      'For hotels, The Bentley on Harrington Gardens is the area\u2019s serious option \u2014 forty-four suites, Leopard Bar, a spa that justifies the journey. The Cranley on Bina Gardens is smaller, more personal.',
    ],
    standardTextParagraphs: [
      '<a href="/services/outcall">Outcall</a> throughout South Kensington. <a href="/services/incall">Incall</a> centrally. Our <a href="/categories/gfe">GFE companions</a> are particularly well suited to the international character of the neighbourhood \u2014 most speak more than one language, several have lived in more than one country.',
    ],
    hotels: ['The Bentley London', 'The Cranley Hotel', 'The Exhibitionist Hotel', 'Ampersand Hotel'],
    restaurants: ['L\u2019Etranger', 'Brasserie Thurloe', 'Colbeh', 'Pasha', 'The Builders Arms'],
    nearbyText:
      '<a href="/london/kensington-escorts/">Kensington</a> is directly north. <a href="/london/chelsea-escorts/">Chelsea</a> is five minutes west. <a href="/london/knightsbridge-escorts/">Knightsbridge</a> is accessible along Brompton Road. <a href="/london/earls-court-escorts/">Earl\u2019s Court</a> lies to the south-west.',
    faq: [
      { q: 'Are companions available in South Kensington tonight?', a: 'Yes. We respond within thirty minutes seven days a week.' },
      { q: 'Do you cover The Bentley and The Cranley?', a: 'Yes, and all other South Kensington hotels and private addresses.' },
      { q: 'What is the minimum booking?', a: 'Thirty minutes for most companions. Two hours for evening arrangements.' },
    ],
    ctaText: 'Available tonight in South Kensington. Thirty-minute response.',
  },

  /* ---------------------------------------------------------------- */
  /*  7. MARYLEBONE                                                    */
  /* ---------------------------------------------------------------- */
  marylebone: {
    metaDescription:
      'Companion agency in Marylebone, London. Verified ladies for hotel visits, dinner dates and private appointments. Incall and outcall. 30-minute response.',
    aboutParagraphs: [
      'Marylebone has become the most comprehensively pleasant neighbourhood in central London. The village logic of the High Street, the quality of the restaurants along Marylebone Lane, the independent shops on Chiltern Street \u2014 it adds up to something that is not trying to be anything other than what it is.',
      'The hotels here reflect the same character. Chiltern Firehouse on Chiltern Street is the obvious address \u2014 obvious in the way that things become obvious because they are consistently right. The Langham on Portland Place is more formally grand. The Mandeville on Mandeville Place is smaller, well located, underrated.',
      'For dinner, Bonnie Gull on Foley Street for fish. Bernardi\u2019s on Seymour Place for Italian. Opso on Paddington Street for modern Greek. The quality of neighbourhood restaurants in Marylebone has no equivalent in central London.',
    ],
    standardTextParagraphs: [
      '<a href="/services/outcall">Outcall</a> to Chiltern Firehouse, The Langham, The Mandeville and all Marylebone addresses. <a href="/services/incall">Incall</a> centrally. For <a href="/services/dinner-date">dinner date arrangements</a>, Marylebone\u2019s restaurant density makes it one of the best-placed neighbourhoods in London.',
    ],
    hotels: ['Chiltern Firehouse', 'The Langham London', 'The Mandeville Hotel', 'The Portman Hotel'],
    restaurants: ['Bonnie Gull', 'Bernardi\u2019s', 'Opso', 'Pachamama', 'The Wigmore'],
    nearbyText:
      '<a href="/london/mayfair-escorts/">Mayfair</a> is fifteen minutes south-east. <a href="/london/notting-hill-escorts/">Notting Hill</a> lies to the west. <a href="/london/paddington-escorts/">Paddington</a> is ten minutes north-west. <a href="/london/soho-escorts/">Soho</a> is accessible via Oxford Street.',
    faq: [
      { q: 'Are companions available in Marylebone tonight?', a: 'Yes. We respond within thirty minutes seven days a week.' },
      { q: 'Do you cover Chiltern Firehouse and The Langham?', a: 'Yes, and all other Marylebone hotels and private addresses.' },
      { q: 'What is the minimum booking?', a: 'Thirty minutes for most companions. Two hours for dinner dates.' },
    ],
    ctaText: 'Available tonight in Marylebone. Thirty-minute response.',
  },

  /* ---------------------------------------------------------------- */
  /*  8. SOHO                                                          */
  /* ---------------------------------------------------------------- */
  soho: {
    metaDescription:
      'Companion agency in Soho, London. Verified ladies for hotel visits, evening arrangements and dinner dates. Available tonight. 30-minute response.',
    aboutParagraphs: [
      'Soho is the one neighbourhood in London that has never tried to be anything other than what it is \u2014 and what it is changes by the hour. By day it is media and agencies, the particular energy of creative industries. By evening it shifts: the restaurants fill, the members\u2019 clubs open their doors, the streets have a different quality of attention.',
      'The hotels in Soho are mostly small, mostly very good. Dean Street Townhouse has sixteen rooms and a restaurant that feeds the neighbourhood six days a week. Ham Yard Hotel on Ham Yard has a courtyard and a character that larger hotels cannot replicate. The Soho Hotel on Richmond Mews is the longest established of the group.',
      'Eating in Soho requires only a direction of travel. Bao on Lexington Street, Barrafina on Frith Street, Temper on Broadwick Street, Evelyn\u2019s Table beneath The Blue Posts. The density of good restaurants per square metre has no equivalent in London.',
    ],
    standardTextParagraphs: [
      '<a href="/services/outcall">Outcall</a> to all Soho hotels and addresses. <a href="/services/incall">Incall</a> centrally. Soho\u2019s character suits companions who are at ease in a less formal environment \u2014 our <a href="/categories/party">party companions</a> and those available for <a href="/services/dinner-date">dinner dates</a> in Soho tend to be among the most socially confident in our roster.',
    ],
    hotels: ['The Soho Hotel', 'Ham Yard Hotel', 'Dean Street Townhouse', 'Karma Sanctum Soho'],
    restaurants: ['Bao', 'Barrafina', 'Temper', 'Evelyn\u2019s Table', 'Bocca di Lupo'],
    nearbyText:
      '<a href="/london/mayfair-escorts/">Mayfair</a> is ten minutes west. <a href="/london/marylebone-escorts/">Marylebone</a> is twenty minutes north. <a href="/london/covent-garden-escorts/">Covent Garden</a> is five minutes east. <a href="/london/fitzrovia-escorts/">Fitzrovia</a> borders Soho to the north.',
    faq: [
      { q: 'Are companions available in Soho tonight?', a: 'Yes. We respond within thirty minutes. Same-day bookings available.' },
      { q: 'Do you offer outcall to Soho hotels?', a: 'Yes, including The Soho Hotel, Ham Yard Hotel and Dean Street Townhouse.' },
      { q: 'What is the minimum booking?', a: 'Thirty minutes for most companions. Two hours for dinner dates.' },
    ],
    ctaText: 'Available tonight in Soho. Thirty-minute response.',
  },

  /* ---------------------------------------------------------------- */
  /*  9. NOTTING HILL                                                  */
  /* ---------------------------------------------------------------- */
  'notting-hill': {
    metaDescription:
      'Companion agency in Notting Hill, London. Verified ladies for private appointments, hotel visits and dinner dates. Incall and outcall.',
    aboutParagraphs: [
      'Notting Hill is a neighbourhood that has always attracted those who want to live well without much ceremony. The pastel houses of Ladbroke Grove and Pembridge Villas, the Saturday market on Portobello Road that the residents mostly avoid, the private garden squares that are not open to the public \u2014 these things together create an atmosphere of comfortable seclusion.',
      'The area\u2019s hotel provision is limited but good. The Portobello Hotel on Stanley Gardens has forty-one rooms and a character that larger hotels cannot replicate. The Laslett on Pembridge Gardens is newer, more design-led.',
      'For dinner, The Ledbury on Ledbury Road is two Michelin stars in an environment that feels nothing like a two-Michelin-star restaurant. Flat Iron on Portobello Road for something more straightforward. Farmacy on Westbourne Grove for a different sensibility.',
    ],
    standardTextParagraphs: [
      '<a href="/services/outcall">Outcall</a> throughout Notting Hill. <a href="/services/incall">Incall</a> centrally. For longer arrangements \u2014 <a href="/services/overnight-stay">overnight</a> or <a href="/services/travel-companion">travel</a> \u2014 our team handles the logistics.',
    ],
    hotels: ['The Portobello Hotel', 'The Laslett', 'Guesthouse West'],
    restaurants: ['The Ledbury', 'Flat Iron', 'Farmacy', 'Books for Cooks', 'The Shed'],
    nearbyText:
      '<a href="/london/kensington-escorts/">Kensington</a> is ten minutes south. <a href="/london/marylebone-escorts/">Marylebone</a> is twenty minutes east. <a href="/london/bayswater-escorts/">Bayswater</a> borders Notting Hill to the east. <a href="/london/chelsea-escorts/">Chelsea</a> is accessible via Kensington.',
    faq: [
      { q: 'Are companions available in Notting Hill tonight?', a: 'Yes. We respond within thirty minutes seven days a week.' },
      { q: 'Do you cover The Portobello Hotel and The Laslett?', a: 'Yes, and all other Notting Hill addresses.' },
      { q: 'What is the minimum booking?', a: 'Thirty minutes for most companions. Two hours for dinner dates.' },
    ],
    ctaText: 'Available tonight in Notting Hill. Thirty-minute response.',
  },

  /* ---------------------------------------------------------------- */
  /*  10. CANARY WHARF                                                 */
  /* ---------------------------------------------------------------- */
  'canary-wharf': {
    metaDescription:
      'Companion agency in Canary Wharf, London. Verified ladies for hotel visits, business dinners and evening arrangements. Available tonight.',
    aboutParagraphs: [
      'Canary Wharf was built for a specific purpose \u2014 to house the financial services industry that outgrew the City of London in the 1980s. The towers of HSBC, Barclays, Citigroup and their neighbours have created a self-contained district with its own transport network and its own residential population.',
      'The hotels here serve a corresponding clientele. Four Seasons Canary Wharf on Westferry Circus is design-led, well suited to those who want quality alongside efficiency. The Canary Riverside Plaza is the established choice for full-service accommodation with river views.',
      'Eating in Canary Wharf has improved. Roka on Park Pavilion for Japanese robatayaki. Plateau on Canada Square for French with a terrace. Boisdale of Canary Wharf for something more characterful.',
    ],
    standardTextParagraphs: [
      'Canary Wharf\u2019s clientele tends toward the specific: an evening after a long day, a dinner where conversation matters. Our <a href="/services/dinner-date">dinner date companions</a> are well matched to this. <a href="/services/outcall">Outcall</a> to Four Seasons Canary Wharf, Canary Riverside Plaza and all E14 addresses. <a href="/services/incall">Incall</a> centrally.',
    ],
    hotels: ['Four Seasons Hotel London at Canary Wharf', 'Canary Riverside Plaza Hotel', 'Doubletree by Hilton Docklands'],
    restaurants: ['Roka Canary Wharf', 'Plateau', 'Boisdale of Canary Wharf', 'Barrio Canary Wharf'],
    nearbyText:
      '<a href="/london/shoreditch-escorts/">Shoreditch</a> is twenty minutes north-west. <a href="/london/city-of-london-escorts/">City of London</a> is accessible via the Jubilee line. <a href="/london/greenwich-escorts/">Greenwich</a> lies to the south across the river.',
    faq: [
      { q: 'Are companions available in Canary Wharf tonight?', a: 'Yes. We respond within thirty minutes. Same-day bookings work well in Canary Wharf given its transport connections.' },
      { q: 'Do you offer outcall to Four Seasons Canary Wharf?', a: 'Yes, and to the Canary Riverside Plaza and all E14 addresses.' },
      { q: 'What is the minimum booking?', a: 'Thirty minutes for most companions. For business dinners, two hours is recommended.' },
    ],
    ctaText: 'Available tonight in Canary Wharf. Thirty-minute response.',
  },
}
