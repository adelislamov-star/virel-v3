/* ------------------------------------------------------------------ *
 *  Category-specific content overrides.                               *
 *  When a category slug has an entry here the generic template text   *
 *  is replaced with bespoke copy.                                     *
 * ------------------------------------------------------------------ */

export interface CategoryFaq {
  q: string
  /** May contain <a href="...">text</a> — rendered via RichText */
  a: string
}

export interface CategoryContent {
  aboutParagraphs: string[]
  /** Paragraphs with <a href> tags */
  standardText: string
  /** Explicit related-category slugs (instead of random) */
  relatedCategories: string[]
  faq: CategoryFaq[]
}

export const categoryContent: Record<string, CategoryContent> = {
  /* ---------------------------------------------------------------- */
  /*  RUSSIAN                                                          */
  /* ---------------------------------------------------------------- */
  russian: {
    aboutParagraphs: [
      'Russian ladies have a particular reputation in London\u2019s companion world \u2014 one that is largely deserved. The combination of a rigorous educational culture, a natural elegance in dress and manner, and a directness that reads as confidence rather than abruptness makes them consistently sought after.',
      'The ladies we represent from Russia and the broader Russian-speaking world are not here by accident. Most have university degrees. Several speak three or more languages. Their understanding of how to conduct themselves at a formal dinner, in a hotel suite, or on a business trip abroad is not something that requires explanation.',
      'What distinguishes a Vaurel Russian companion from the broader category is selection. We introduce a small number of ladies. Each one has been personally met by our team. The standard is consistent.',
    ],
    standardText:
      'For an evening in <a href="/london/mayfair-escorts/">Mayfair</a> or <a href="/london/knightsbridge-escorts/">Knightsbridge</a>, our Russian companions are among the most naturally suited to those environments. Many are available for <a href="/services/overnight-stay">overnight arrangements</a> and <a href="/services/travel-companion">travel</a>. For those looking for warmth alongside sophistication, the <a href="/categories/gfe">girlfriend experience</a> is the arrangement most frequently requested.',
    relatedCategories: ['ukrainian', 'eastern-european', 'blonde', 'gfe', 'elite', 'dinner-date'],
    faq: [
      { q: 'What makes Russian companions different?', a: 'Education, composure and a naturalness in formal environments. The ladies we represent have been personally introduced to our team and meet a consistent standard.' },
      { q: 'Are Russian companions available for travel?', a: 'Yes. Several of our Russian ladies travel regularly with clients. Arrangements outside London are handled by our team.' },
      { q: 'What is the typical rate for a Russian companion?', a: 'Rates begin from \u00a3300 per hour and vary by companion. Full rate information is on individual profiles.' },
      { q: 'Are overnight bookings available?', a: 'Yes. Contact our team for availability and rates.' },
    ],
  },

  /* ---------------------------------------------------------------- */
  /*  GFE                                                              */
  /* ---------------------------------------------------------------- */
  gfe: {
    aboutParagraphs: [
      'The girlfriend experience is the most requested arrangement at Vaurel, and the most misunderstood outside the people who actually book it. It is not a performance. It is not a script. It is the simple quality of spending time with someone who is genuinely present \u2014 interested in the conversation, comfortable in the environment, at ease in her own company and yours.',
      'The ladies we represent for GFE arrangements are selected specifically for this quality. Intelligence matters here more than it does anywhere else. The ability to hold a conversation across subjects \u2014 and to listen as well as speak \u2014 is not a minor detail. Neither is the ease with which they move through restaurants, hotel lobbies, and unfamiliar social situations.',
      'A GFE booking with Vaurel looks like this: you make contact, we suggest one or two ladies based on what you\u2019ve told us, you confirm, and the evening proceeds as naturally as any other. No awkwardness at the start. No watching the clock at the end.',
    ],
    standardText:
      'Our GFE companions are available across London \u2014 <a href="/london/mayfair-escorts/">Mayfair</a>, <a href="/london/knightsbridge-escorts/">Knightsbridge</a>, <a href="/london/chelsea-escorts/">Chelsea</a> and beyond. Most are available for <a href="/services/dinner-date">dinner dates</a>, <a href="/services/overnight-stay">overnight stays</a> and <a href="/services/travel-companion">travel</a>. <a href="/services/incall">Incall</a> and <a href="/services/outcall">outcall</a> both available. Rates from \u00a3300 per hour \u2014 individual profiles carry full details.',
    relatedCategories: ['elite', 'vip', 'dinner-date', 'overnight', 'russian', 'blonde'],
    faq: [
      { q: 'What exactly is the girlfriend experience?', a: 'Time spent with someone who is genuinely present. Conversation, comfort, ease. Not a performance \u2014 a natural evening with a person worth spending it with.' },
      { q: 'How long should a GFE booking be?', a: 'Most clients book a minimum of two hours. For dinner and an evening, three to four hours. Overnight arrangements are also common.' },
      { q: 'Can I request a specific companion for GFE?', a: 'Yes. Browse profiles and contact us with your preference. We will confirm availability and arrange the introduction.' },
      { q: 'Is GFE available for travel outside London?', a: 'Yes. Several of our companions travel regularly. Contact our team for arrangements.' },
    ],
  },

  /* ---------------------------------------------------------------- */
  /*  BLONDE                                                           */
  /* ---------------------------------------------------------------- */
  blonde: {
    aboutParagraphs: [
      'The preference for blonde companions is one of the most consistent in the category \u2014 and the variation within it is wider than most people expect. Natural blonde, highlighted, platinum, dark blonde with light eyes. Petite and model-tall. Northern European and Latin. The common thread is not a hair colour but a particular quality of presence that a certain kind of blonde carries: light, unhurried, comfortable in her own skin.',
      'The ladies we represent in this category span that range. Several are Eastern European \u2014 Polish, Czech, Russian with fair colouring. Several are Brazilian, which brings its own distinct quality of warmth alongside the appearance. A few are British, which is rarer in this world than people assume.',
      'What they share is that they have been personally introduced to our team and meet the standard we apply across every category.',
    ],
    standardText:
      'Our blonde companions are available across <a href="/london/mayfair-escorts/">Mayfair</a>, <a href="/london/knightsbridge-escorts/">Knightsbridge</a>, <a href="/london/chelsea-escorts/">Chelsea</a> and throughout London. Many offer <a href="/categories/gfe">GFE arrangements</a>, <a href="/services/dinner-date">dinner dates</a> and <a href="/services/overnight-stay">overnight stays</a>. <a href="/services/outcall">Outcall</a> to all major hotels. Rates from \u00a3300 per hour.',
    relatedCategories: ['brunette', 'russian', 'petite', 'busty', 'gfe', 'young'],
    faq: [
      { q: 'Are your blonde companions natural?', a: 'Our selection includes both natural and highlighted blondes. Profile descriptions indicate colouring in detail.' },
      { q: 'What nationalities are available in this category?', a: 'Eastern European, Brazilian, British and others. Nationality is listed on individual profiles.' },
      { q: 'Are blonde companions available for overnight bookings?', a: 'Yes. Many of our blonde companions offer overnight arrangements. Contact our team for availability.' },
      { q: 'What are the rates?', a: 'Rates begin from \u00a3300 per hour. Full pricing is on individual profiles.' },
    ],
  },

  /* ---------------------------------------------------------------- */
  /*  BRUNETTE                                                         */
  /* ---------------------------------------------------------------- */
  brunette: {
    aboutParagraphs: [
      'If blonde carries a certain kind of light, brunette carries depth. The ladies in this category tend toward a particular kind of composure \u2014 darker colouring that suits the candlelit settings of London\u2019s better restaurants, a presence that reads as serious without being severe.',
      'The range here is considerable. Italian and Spanish brunettes with Mediterranean warmth. Russian and Ukrainian with Slavic precision. Latin American \u2014 Brazilian, Colombian, Venezuelan \u2014 with a quality of energy that sits differently in a room. British, which again is rarer than expected.',
      'What the category shares is that dark hair and dark eyes, in the right person, create a kind of visual authority that lighter colouring does not. Our team selects for this. The ladies here know how to enter a room.',
    ],
    standardText:
      'Available across London \u2014 <a href="/london/mayfair-escorts/">Mayfair</a>, <a href="/london/belgravia-escorts/">Belgravia</a>, <a href="/london/kensington-escorts/">Kensington</a> and elsewhere. Most offer <a href="/categories/gfe">GFE</a>, <a href="/services/dinner-date">dinner date</a> and <a href="/services/overnight-stay">overnight</a> arrangements. <a href="/services/incall">Incall</a> and <a href="/services/outcall">outcall</a> available. Full rates on individual profiles.',
    relatedCategories: ['blonde', 'russian', 'italian', 'spanish', 'latin', 'gfe'],
    faq: [
      { q: 'What nationalities are in the brunette category?', a: 'Italian, Spanish, Russian, Ukrainian, Brazilian, Colombian and others. Nationality is listed on individual profiles.' },
      { q: 'Are brunette companions available for dinner dates?', a: 'Yes. Most of our brunette companions are well suited to restaurant evenings and formal events.' },
      { q: 'What is the minimum booking duration?', a: 'Most companions accept bookings from one hour. Longer arrangements are recommended for dinner dates.' },
      { q: 'What are the rates?', a: 'Rates begin from \u00a3300 per hour and vary by companion. Individual profiles carry full pricing.' },
    ],
  },

  /* ---------------------------------------------------------------- */
  /*  ELITE                                                            */
  /* ---------------------------------------------------------------- */
  elite: {
    aboutParagraphs: [
      'The word elite is used freely in this industry and means very little most of the time. We use it to mean something specific: ladies who require no introduction to the environments our clients move through. Ladies who have lived internationally, who are comfortable in black tie and equally comfortable in a hotel suite at midnight, who understand that the quality of an evening is determined by the quality of conversation and presence rather than anything else.',
      'Our elite tier is not defined by appearance alone, though appearance is part of it. It is defined by a combination of qualities that cannot be manufactured: education, composure, genuine intelligence, and an ease in the world that comes from having navigated it well. These are not common qualities. The number of companions at this level who work through Vaurel is deliberately small.',
      'If you have worked with companion agencies before and found the experience transactional, this is the answer to that.',
    ],
    standardText:
      'Elite companions are available for <a href="/services/dinner-date">dinner dates</a>, <a href="/services/overnight-stay">overnight arrangements</a> and <a href="/services/travel-companion">travel</a> across London and internationally. Available in <a href="/london/mayfair-escorts/">Mayfair</a>, <a href="/london/belgravia-escorts/">Belgravia</a>, <a href="/london/knightsbridge-escorts/">Knightsbridge</a> and all central London locations. Contact our team for introductions \u2014 availability is limited.',
    relatedCategories: ['vip', 'high-class', 'gfe', 'dinner-date', 'travel-companion', 'russian'],
    faq: [
      { q: 'What separates elite companions from standard?', a: 'Education, international experience and an ease in formal environments. Our elite companions have been selected specifically for these qualities, not appearance alone.' },
      { q: 'How do I book an elite companion?', a: 'Contact our team directly. We will discuss your requirements and suggest the most suitable introduction.' },
      { q: 'Are elite companions available for travel?', a: 'Yes. Several travel internationally as a matter of course. Multi-day arrangements are available.' },
      { q: 'What are the rates for elite companions?', a: 'Rates vary by companion and arrangement. Contact our team for details.' },
    ],
  },

  /* ---------------------------------------------------------------- */
  /*  VIP                                                              */
  /* ---------------------------------------------------------------- */
  vip: {
    aboutParagraphs: [
      'VIP at Vaurel means that the arrangement receives our full attention from the first message to the end of the evening. It means the companion has been selected with specific care for the client\u2019s situation \u2014 not the first available name from a list, but a considered introduction.',
      'The ladies in this category are available for arrangements that go beyond the standard. Extended evenings, multi-day trips, events requiring a companion who can move through a formal environment without briefing. Several hold postgraduate degrees. Several travel internationally as a matter of course.',
      'The practical difference between a VIP arrangement and a standard booking is in the detail. We handle the logistics \u2014 restaurant reservations, travel, any specific requirements \u2014 so that the client\u2019s only responsibility is to be present.',
    ],
    standardText:
      'VIP arrangements available across London and internationally. <a href="/services/outcall">Outcall</a> to all central London hotels. <a href="/services/travel-companion">Travel companions</a> available for trips outside the UK. Contact our team directly for VIP introductions \u2014 <a href="/discretion">Telegram</a> or email.',
    relatedCategories: ['elite', 'high-class', 'gfe', 'dinner-date', 'overnight', 'travel-companion'],
    faq: [
      { q: 'What does VIP mean at Vaurel?', a: 'Full attention from first contact to end of evening. A considered introduction, not a list. Logistics handled by our team.' },
      { q: 'Are VIP companions available for multi-day arrangements?', a: 'Yes. Several of our VIP ladies travel internationally and are available for extended bookings.' },
      { q: 'How much notice is required for a VIP booking?', a: 'Same-day arrangements are sometimes possible. For specific companions or travel, 24\u201348 hours is recommended.' },
      { q: 'How do I make a VIP booking?', a: 'Contact our team by Telegram or email. We will discuss your requirements and arrange the introduction.' },
    ],
  },

  /* ---------------------------------------------------------------- */
  /*  DINNER DATE                                                      */
  /* ---------------------------------------------------------------- */
  'dinner-date': {
    aboutParagraphs: [
      'A dinner date is the arrangement that separates the agencies who understand what they are doing from those who do not. The requirements are specific: a companion who can hold a conversation through a three-course meal without effort, who knows how to read a wine list, who understands the difference between a restaurant where discretion is required and one where a certain visibility is the point.',
      'Our dinner date companions have been selected with this in mind. Most have spent significant time in London\u2019s restaurant world as guests, not as service. They have opinions about food and wine. They know the rooms \u2014 who sits where, what the lighting is like, why one table is preferable to another.',
      'For clients with a specific restaurant in mind \u2014 a booking at Scott\u2019s, a private room at The Connaught, a table at Barrafina \u2014 we can coordinate the reservation alongside the introduction if required.',
    ],
    standardText:
      'Available across London for dinner at any restaurant, private dining venue or hotel. <a href="/london/mayfair-escorts/">Mayfair</a>, <a href="/london/knightsbridge-escorts/">Knightsbridge</a>, <a href="/london/marylebone-escorts/">Marylebone</a>, <a href="/london/soho-escorts/">Soho</a> and beyond. Many companions available for <a href="/services/overnight-stay">overnight arrangements</a> following dinner. <a href="/services/outcall">Outcall</a> to hotel restaurants and private addresses.',
    relatedCategories: ['gfe', 'elite', 'vip', 'overnight', 'travel-companion', 'high-class'],
    faq: [
      { q: 'What restaurants do your companions know?', a: 'Most are familiar with London\u2019s main dining rooms \u2014 Mayfair, Knightsbridge, Marylebone, Soho. If you have a specific venue, mention it when you contact us.' },
      { q: 'Can you help with restaurant reservations?', a: 'Yes. For VIP and elite arrangements, our team can coordinate the reservation alongside the introduction.' },
      { q: 'How long should a dinner date booking be?', a: 'Three to four hours covers drinks, dinner and the evening. Overnight arrangements are available for those who prefer not to end the evening early.' },
      { q: 'Is a dinner date available for events and functions?', a: 'Yes. Companions are available for private events, corporate functions and social occasions that require a guest.' },
    ],
  },

  /* ---------------------------------------------------------------- */
  /*  MATURE                                                           */
  /* ---------------------------------------------------------------- */
  mature: {
    aboutParagraphs: [
      'The preference for mature companions is more common than the industry acknowledges, and more rational than the preference for youth that dominates the marketing. A lady in her thirties or forties who has navigated the world well carries something that cannot be replicated by someone younger: the ease of someone who has nothing to prove, the confidence of someone who knows exactly who she is.',
      'Our mature companions \u2014 which at Vaurel means ladies from their late twenties through their forties \u2014 are among the most consistently re-booked in our roster. The reasons are not complicated. They are better conversationalists. They are more comfortable in formal environments. They do not require management.',
      'For clients who find the standard companion world too focused on appearance over substance, this category is the correction.',
    ],
    standardText:
      'Available across London for <a href="/categories/gfe">GFE arrangements</a>, <a href="/services/dinner-date">dinner dates</a> and <a href="/services/overnight-stay">overnight stays</a>. <a href="/london/mayfair-escorts/">Mayfair</a>, <a href="/london/chelsea-escorts/">Chelsea</a>, <a href="/london/kensington-escorts/">Kensington</a> and all central London locations. <a href="/services/incall">Incall</a> and <a href="/services/outcall">outcall</a> available.',
    relatedCategories: ['gfe', 'elite', 'dinner-date', 'russian', 'brunette', 'high-class'],
    faq: [
      { q: 'What age range does mature cover?', a: 'At Vaurel, mature means ladies from their late twenties through their forties. Specific ages are listed on individual profiles.' },
      { q: 'Why do clients prefer mature companions?', a: 'Conversation, composure and an ease in formal environments that comes with experience. The most consistently re-booked companions on our roster are in this category.' },
      { q: 'Are mature companions available for dinner dates?', a: 'Yes \u2014 and they are among the most suited to it. Restaurant evenings, events, private dining.' },
      { q: 'Are overnight arrangements available?', a: 'Yes. Contact our team for availability and rates.' },
    ],
  },

  /* ---------------------------------------------------------------- */
  /*  BUSTY                                                            */
  /* ---------------------------------------------------------------- */
  busty: {
    aboutParagraphs: [
      'Physical preference is personal, and we represent it without commentary. The ladies in this category have been selected with the same criteria applied across our entire roster \u2014 presentation, composure, the ability to move through London\u2019s better environments without effort \u2014 with the additional qualification that they meet the physical description the category implies.',
      'The range within this category is wider than the label suggests. Petite with curves. Tall and proportioned. Natural and enhanced. Eastern European, Latin, British. The common thread is that each lady has been personally introduced to our team and meets our standard.',
      'Availability changes regularly as new companions join. Contact our team if you are looking for something specific.',
    ],
    standardText:
      'Available in <a href="/london/mayfair-escorts/">Mayfair</a>, <a href="/london/knightsbridge-escorts/">Knightsbridge</a>, <a href="/london/chelsea-escorts/">Chelsea</a> and throughout London. Most offer <a href="/categories/gfe">GFE</a> and <a href="/services/dinner-date">dinner date</a> arrangements. <a href="/services/outcall">Outcall</a> to all major hotels. Full rates on individual profiles from \u00a3300/hr.',
    relatedCategories: ['blonde', 'brunette', 'curvy', 'russian', 'young', 'gfe'],
    faq: [
      { q: 'Are the companions in this category natural?', a: 'Both natural and enhanced. Profile descriptions specify. Contact our team if you have a preference.' },
      { q: 'What nationalities are available?', a: 'Eastern European, Latin American, British and others. Nationality is listed on individual profiles.' },
      { q: 'Are dinner date arrangements available?', a: 'Yes. Companions in this category are available for restaurant evenings and hotel visits.' },
      { q: 'What are the rates?', a: 'From \u00a3300 per hour. Full pricing on individual profiles.' },
    ],
  },

  /* ---------------------------------------------------------------- */
  /*  HIGH CLASS                                                       */
  /* ---------------------------------------------------------------- */
  'high-class': {
    aboutParagraphs: [
      'High class is a description of the arrangement as much as the person. It means that every element of the booking \u2014 from the first message to the end of the evening \u2014 is handled at a level that reflects what is being paid for. The companion is exceptional. The communication is prompt and clear. The logistics are managed without friction.',
      'The ladies in this category are selected for the full combination of qualities that the description implies. Appearance that commands attention. Conversation that holds it. The discretion to understand that some situations require more care than others, and the judgment to apply that care without being asked.',
      'For clients who have worked with other agencies and found the gap between the marketing and the reality too wide, this is where that gap closes.',
    ],
    standardText:
      'Available for exclusive arrangements across London \u2014 <a href="/london/mayfair-escorts/">Mayfair</a>, <a href="/london/belgravia-escorts/">Belgravia</a>, <a href="/london/knightsbridge-escorts/">Knightsbridge</a> and all central locations. <a href="/services/travel-companion">Travel companions</a> available internationally. <a href="/services/overnight-stay">Overnight arrangements</a> available. Contact our team for introductions.',
    relatedCategories: ['elite', 'vip', 'gfe', 'dinner-date', 'russian', 'mature'],
    faq: [
      { q: 'What is the difference between high class and elite?', a: 'Functionally similar \u2014 both represent the top tier of our selection. Elite emphasises experience and international background; high class emphasises the quality of the full arrangement end to end.' },
      { q: 'Are high class companions available tonight?', a: 'Often yes. Contact our team and we will confirm availability for the same evening.' },
      { q: 'Is travel available with high class companions?', a: 'Yes. Several are available for international trips. Contact our team for arrangements.' },
      { q: 'What are the rates?', a: 'Rates vary. Contact our team directly \u2014 we will match you with a companion that fits both your preference and budget.' },
    ],
  },
}
