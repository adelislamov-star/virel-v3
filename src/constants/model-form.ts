export const NATIONALITIES = [
  'American', 'Arabic', 'Argentinian', 'Asian', 'Australian', 'Austrian',
  'Belarusian', 'Belgian', 'Black African', 'Bolivian', 'Brazilian', 'British',
  'Bulgarian', 'Canadian', 'Caribbean', 'Chilean', 'Chinese', 'Colombian',
  'Costa Rican', 'Cuban', 'Czech', 'Danish', 'Dominican', 'Ecuadorian',
  'Eastern European', 'Estonian', 'Filipino', 'Finnish', 'French', 'German',
  'Ghanaian', 'Greek', 'Hungarian', 'Indian', 'Iranian', 'Irish', 'Italian',
  'Japanese', 'Kazakh', 'Korean', 'Kyrgyz', 'Latin American', 'Latvian',
  'Lebanese', 'Lithuanian', 'Maltese', 'Mexican', 'Moldavian', 'Mongolian',
  'Moroccan', 'New Zealander', 'Nigerian', 'Northern European', 'Norwegian',
  'Pakistani', 'Paraguayan', 'Peruvian', 'Persian', 'Polish', 'Portuguese',
  'Romanian', 'Russian', 'Serbian', 'Slovakian', 'Spanish', 'Swedish',
  'Taiwanese', 'Thai', 'Turkish', 'Ukrainian', 'Venezuelan', 'Vietnamese',
  'Western European', 'Other',
]

export const ETHNICITIES = [
  'White European', 'White British', 'White North American', 'White South African',
  'White Australian', 'White and Asian', 'White and Black',
  'Latin', 'Asian', 'Asian British', 'Chinese', 'Indian', 'Bangladeshi',
  'Pakistani', 'Black', 'Black British', 'Black African', 'Black Caribbean',
  'Arabic', 'Mixed', 'Any other ethnic group',
]

export const LANGUAGES = [
  'Arabic', 'Belarusian', 'Bengali', 'Bulgarian', 'Chinese', 'Czech',
  'Dutch', 'English', 'Estonian', 'Farsi', 'Filipino', 'Finnish',
  'French', 'German', 'Greek', 'Hindi', 'Hungarian', 'Italian',
  'Japanese', 'Kazakh', 'Korean', 'Latvian', 'Lithuanian', 'Moldavian',
  'Norwegian', 'Polish', 'Portuguese', 'Romanian', 'Russian', 'Serbian',
  'Slovak', 'Spanish', 'Swedish', 'Thai', 'Turkish', 'Ukrainian',
  'Urdu', 'Vietnamese',
]

export const LANGUAGE_LEVELS = ['Basic', 'Conversational', 'Fluent', 'Native']

export const LONDON_STATIONS = [
  'Aldgate', 'Aldgate East', 'Angel', 'Archway', 'Avenue Road',
  'Baker Street', 'Barbican', 'Barons Court', 'Battersea Park', 'Battersea Power',
  'Bayswater', 'Belsize Park', 'Bond Street', 'Bounds Green', 'Bowes Park',
  'Brent Cross', 'Brent Cross West', 'Caledonian Road',
  'Caledonian Road & Barnsbury', 'Camden Road', 'Camden Town',
  'Canada Water', 'Canary Wharf', 'Cannon Street', 'Chancery Lane',
  'Charing Cross', 'City Thameslink', 'Colliers Wood', 'Covent Garden',
  'Cricklewood', 'Crossharbour', 'Crouch Hill',
  "Earl's Court", 'Edgware Road', 'Embankment', 'Euston', 'Euston Square',
  'Farringdon', 'Finchley Road', 'Finchley Road & Frognal',
  'Fulham Broadway', 'Gloucester Road', 'Golders Green', 'Goldhawk Road',
  'Goodge Street', 'Great Portland Street', 'Green Park', 'Haggerston',
  'Hampstead', 'Hendon', 'Hendon Central', 'Heron Quays',
  'High Street Kensington', 'Highgate', 'Holland Park', 'Holloway Road',
  'Hoxton', 'Hyde Park Corner', 'Imperial Wharf',
  'Kensington Olympia', "King's Cross St Pancras", 'Knightsbridge',
  'Lancaster Gate', 'Leicester Square', 'Liverpool Street',
  'London Bridge', 'Marble Arch', 'Maida Vale', 'Manor House',
  'Mile End', 'Moorgate', 'Mornington Crescent',
  'Neasden', 'North Wembley', 'Northwick Park', 'Notting Hill Gate',
  'Old Street', 'Oxford Circus', 'Paddington',
  'Parsons Green', 'Pimlico', 'Putney Bridge',
  'Queensway', 'Regent Street', 'Royal Oak', 'Russell Square',
  'Seven Sisters', 'Shepherd Bush', 'Shepherd Bush Market',
  'Sloane Square', 'South Kensington', 'Southwark', "St John's Wood",
  'Stepney Green', 'Stockwell', 'Stratford', 'Swiss Cottage',
  'Temple', 'Tufnell Park', 'Tottenham Court Road', 'Tower Hill',
  'Victoria', 'Wapping', 'Warren Street', 'Waterloo',
  'Wembley Park', 'Westbourne Park', 'Westminster',
  'Whitechapel', 'Wimbledon', 'Wood Lane',
]

export const HEIGHTS = Array.from({ length: 36 }, (_, i) => {
  const cm = 150 + i
  const totalInches = Math.round(cm / 2.54)
  const ft = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  return { value: cm.toString(), label: `${cm}cm (${ft}'${inches}")` }
})

export const WEIGHTS = Array.from({ length: 50 }, (_, i) => {
  const kg = 40 + i
  const lbs = Math.round(kg * 2.205)
  return { value: kg.toString(), label: `${kg}kg (${lbs}lbs)` }
})

export const DRESS_SIZES = [
  'UK 6 / EU 34', 'UK 8 / EU 36', 'UK 10 / EU 38',
  'UK 12 / EU 40', 'UK 14 / EU 42', 'UK 16 / EU 44', 'UK 18+ / EU 46+',
]

export const FOOT_SIZES = [
  'UK 2.5 / EU 35', 'UK 3 / EU 35.5', 'UK 3.5 / EU 36',
  'UK 4 / EU 37', 'UK 4.5 / EU 37.5', 'UK 5 / EU 38',
  'UK 5.5 / EU 38.5', 'UK 6 / EU 39', 'UK 6.5 / EU 40',
  'UK 7 / EU 40.5', 'UK 7.5 / EU 41', 'UK 8 / EU 42',
]

export const BUST_SIZES = [
  '28AA', '30A', '30B', '32A', '32B', '32C', '32D', '32DD',
  '34A', '34B', '34C', '34D', '34DD', '34E', '34F',
  '36A', '36B', '36C', '36D', '36DD', '36E', '36F',
  '38B', '38C', '38D', '38DD', '38E', '38F',
  '40C', '40D', '40DD', '42D',
]

export const BUST_TYPES = ['Natural', 'Enhanced']

export const EYE_COLORS = [
  'Blue', 'Green', 'Brown', 'Hazel', 'Grey', 'Dark Brown', 'Black',
]

export const HAIR_COLORS = ['Blonde', 'Brunette', 'Light Brown', 'Redhead', 'Black', 'Other']

export const HAIR_LENGTHS = ['Long', 'Medium', 'Short']

export const SMOKING = ['Non-Smoker', 'Occasional Smoker', 'Smoker']

export const TATTOOS = ['None', 'Small', 'Medium', 'Large', 'Full sleeves']

export const PIERCINGS = [
  'None', 'Ears', 'Belly', 'Nipples', 'Nose', 'Tongue', 'Eyebrow', 'Lip', 'Other',
]

export const ORIENTATIONS = ['Heterosexual', 'Bisexual', 'Lesbian']

export const TRAVEL_OPTIONS = [
  'London only', 'UK & Europe', 'Worldwide',
]

export const AVAILABILITY_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

export const WARDROBE_OPTIONS = [
  'Schoolgirl', 'Secretary', 'Nurse', 'Bikini', 'Catsuit',
  'PVC', 'Lingerie', 'Corset', 'Latex', 'Stilettos', 'Bunny',
  'Stockings', 'Police', 'French Maid', 'Teacher', 'Stewardess',
  'Housekeeper', 'Cheerleader', 'Devil', 'Army', 'Pilot', 'Sailor',
  'Santa', 'Leopard', 'Snow Maiden', 'Gym', 'Harley Quinn',
]

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'terminal', label: 'Card Terminal' },
  { value: 'bankTransfer', label: 'Bank Transfer' },
  { value: 'monese', label: 'Monese' },
  { value: 'monzo', label: 'Monzo' },
  { value: 'revolut', label: 'Revolut' },
  { value: 'starling', label: 'Starling' },
  { value: 'btc', label: 'BTC' },
  { value: 'ltc', label: 'LTC' },
  { value: 'usdt', label: 'USDT' },
]

export const PREFERENCE_FIELDS = [
  { field: 'worksWithCouples', label: 'Works with couples' },
  { field: 'worksWithWomen', label: 'Works with women' },
  { field: 'dinnerDates', label: 'Dinner dates' },
  { field: 'travelCompanion', label: 'Travel companion' },
  { field: 'willingPrivatePlaces', label: 'Willing — private places' },
  { field: 'willingInternational', label: 'Willing — international outcalls' },
  { field: 'willingLongDistance', label: 'Willing — long distance' },
  { field: 'willingDisabled', label: 'Willing — disabled clients' },
  { field: 'hasFlatmates', label: 'Has flatmates' },
]

export const MODEL_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Under Review' },
  { value: 'published', label: 'Active' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'archived', label: 'Archived' },
]

export const MODEL_VISIBILITY = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'unlisted', label: 'Unlisted' },
]
