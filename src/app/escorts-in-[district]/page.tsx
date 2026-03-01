// @ts-nocheck
export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/db/client'

const DISTRICTS: Record<string, { title: string; h1: string; description: string; content: string }> = {
  'aldgate': { title: 'Escorts in Aldgate | Premium Companions | Virel', h1: 'Escorts in Aldgate', description: 'Premium companion services in Aldgate, London. Verified, discreet escorts available for incall and outcall.', content: 'Aldgate sits at the heart of the City of London, a dynamic blend of historic architecture and modern finance. Our Aldgate companions are sophisticated professionals who understand the demands of city life.\n\nWhether you\'re staying nearby or working in the area, our escorts provide a discreet, professional service tailored to your needs.' },
  'baker-street': { title: 'Escorts in Baker Street | Premium Companions | Virel', h1: 'Escorts in Baker Street', description: 'Elegant companion services in Baker Street, London. Sophisticated escorts near Regent\'s Park and Marylebone.', content: 'Baker Street\'s charming Victorian streetscape and proximity to Regent\'s Park make it one of London\'s most characterful areas. Our Baker Street companions embody this blend of classic elegance and modern sophistication.\n\nFrom the boutiques of Marylebone High Street to the open spaces of Regent\'s Park, our escorts are the perfect companions for exploring this wonderful neighbourhood.' },
  'battersea': { title: 'Escorts in Battersea | Premium Companions | Virel', h1: 'Escorts in Battersea', description: 'Premium escort services in Battersea, South London. Stylish companions near Battersea Power Station and the Thames.', content: 'Battersea has transformed into one of London\'s most exciting riverside destinations, anchored by the iconic Power Station and beautiful park. Our Battersea companions share this vibrant energy.\n\nWith stunning Thames views and excellent transport links, Battersea is perfectly positioned for a memorable encounter with one of our premium escorts.' },
  'bayswater': { title: 'Escorts in Bayswater | Premium Companions | Virel', h1: 'Escorts in Bayswater', description: 'Sophisticated companion services in Bayswater, London. Elegant escorts near Hyde Park and Notting Hill.', content: 'Bayswater\'s elegant garden squares and proximity to Hyde Park create a serene backdrop for premium companionship. Bordered by Notting Hill and Kensington, our Bayswater escorts reflect the area\'s cosmopolitan character.\n\nWith Hyde Park on the doorstep and excellent connections to the West End, Bayswater offers the perfect setting for a refined experience.' },
  'belgravia': { title: 'Escorts in Belgravia | Elite Companions | Virel', h1: 'Escorts in Belgravia', description: 'Elite companion services in Belgravia, one of London\'s most exclusive addresses. Discreet, professional escorts.', content: 'Belgravia\'s white stucco townhouses and garden squares set the scene for London\'s most exclusive residential area. Our Belgravia companions match the neighbourhood\'s understated luxury — refined, discreet, and impeccable.\n\nHome to embassies, luxury hotels, and private residences, Belgravia demands the highest standards — which our companions consistently deliver.' },
  'bermondsey': { title: 'Escorts in Bermondsey | Premium Companions | Virel', h1: 'Escorts in Bermondsey', description: 'Dynamic companion services in Bermondsey, South London. Stylish escorts in this creative riverside neighbourhood.', content: 'Bermondsey has evolved into one of London\'s most exciting creative neighbourhoods, known for its art galleries, independent restaurants, and riverside walks. Our Bermondsey companions share this contemporary, creative spirit.\n\nFrom Borough Market to the Tate Modern, there\'s no shortage of exceptional experiences to share with our escorts in this vibrant area.' },
  'bloomsbury': { title: 'Escorts in Bloomsbury | Cultured Companions | Virel', h1: 'Escorts in Bloomsbury', description: 'Cultured companion services in Bloomsbury, London. Intelligent, sophisticated escorts near the British Museum.', content: 'Bloomsbury\'s literary and academic heritage — home to the British Museum, University of London, and countless publishing houses — attracts some of London\'s most cultured visitors. Our Bloomsbury companions are selected for their intelligence and sophistication.\n\nWhether you\'re visiting for academia, culture, or leisure, our escorts are exceptional conversationalists who bring genuine depth to every encounter.' },
  'bond-street': { title: 'Escorts in Bond Street | Luxury Companions | Virel', h1: 'Escorts in Bond Street', description: 'Luxury companion services in Bond Street, London\'s premier shopping destination. Impeccably presented escorts.', content: 'Bond Street is synonymous with luxury — home to the world\'s most prestigious fashion houses, jewellers, and art galleries. Our Bond Street companions are as impeccably presented as their surroundings.\n\nPerfect for accompanying you on a shopping excursion or an elegant evening in Mayfair, our Bond Street escorts embody effortless style.' },
  'brixton': { title: 'Escorts in Brixton | Vibrant Companions | Virel', h1: 'Escorts in Brixton', description: 'Vibrant companion services in Brixton, South London. Energetic, engaging escorts in this lively neighbourhood.', content: 'Brixton\'s unique energy — a fusion of Caribbean culture, live music venues, and independent restaurants — makes it one of London\'s most exciting neighbourhoods. Our Brixton companions bring this same vivacious spirit.\n\nFrom the famous market to the legendary music venues, Brixton offers endless possibilities for a memorable evening with one of our companions.' },
  'camden': { title: 'Escorts in Camden | Dynamic Companions | Virel', h1: 'Escorts in Camden', description: 'Dynamic companion services in Camden, London. Eclectic, engaging escorts in this iconic North London neighbourhood.', content: 'Camden\'s iconic market, live music scene, and eclectic atmosphere attract visitors from around the world. Our Camden companions are vibrant, engaging, and perfectly suited to this uniquely creative neighbourhood.\n\nWhether exploring the market, catching a show at the Forum, or dining along the canal, Camden offers a truly unique backdrop for companionship.' },
  'canary-wharf': { title: 'Escorts in Canary Wharf | Business Companions | Virel', h1: 'Escorts in Canary Wharf', description: 'Professional companion services in Canary Wharf. Sophisticated escorts for business travellers and city professionals.', content: 'Canary Wharf attracts the world\'s leading finance professionals and business travellers. Our companions here understand the demands of a professional lifestyle — punctual, polished, and perfect for corporate entertaining.\n\nWith world-class restaurants, luxury hotels, and stunning riverside views, Canary Wharf provides an exceptional setting for premium companionship.' },
  'chelsea': { title: 'Escorts in Chelsea | Elegant Companions | Virel', h1: 'Escorts in Chelsea', description: 'Elegant companion services in Chelsea, London. Stylish, sophisticated escorts for incall and outcall.', content: 'Chelsea\'s artistic heritage and vibrant atmosphere attract some of London\'s most cultured residents and visitors. Our Chelsea companions share this energy — creative, stylish, and engaging.\n\nFrom the King\'s Road boutiques to the renowned restaurants of Sloane Square, Chelsea is the perfect setting for an unforgettable experience with one of our elite companions.' },
  'covent-garden': { title: 'Escorts in Covent Garden | Premium Companions | Virel', h1: 'Escorts in Covent Garden', description: 'Premium companion services in Covent Garden. Lively, sophisticated escorts in London\'s entertainment heart.', content: 'Covent Garden sits at the heart of London\'s entertainment district, surrounded by world-class theatres, restaurants, and boutiques. Our Covent Garden companions are the perfect partners for a night at the opera or a fine dining experience.\n\nWith the Royal Opera House, the Ivy, and countless cultural venues nearby, Covent Garden offers endless possibilities for a memorable evening.' },
  'dalston': { title: 'Escorts in Dalston | Trendy Companions | Virel', h1: 'Escorts in Dalston', description: 'Trendy companion services in Dalston, East London. Creative, eclectic escorts in this vibrant nightlife district.', content: 'Dalston has become East London\'s most exciting nightlife destination, known for its independent bars, creative scene, and diverse community. Our Dalston companions embody this contemporary, free-spirited energy.\n\nPerfect for exploring the area\'s acclaimed restaurant scene or vibrant nightlife, our escorts bring genuine personality and charm to every encounter.' },
  'earls-court': { title: 'Escorts in Earls Court | Premium Companions | Virel', h1: 'Escorts in Earls Court', description: 'Premium escort services in Earls Court, West London. Sophisticated companions near Kensington and Chelsea.', content: 'Earls Court\'s central location between Kensington and Chelsea makes it an ideal base for exploring West London. Our Earls Court companions are versatile, engaging, and perfectly situated for visits across the city.\n\nWith excellent transport links and proximity to some of London\'s finest destinations, Earls Court provides a convenient and discreet setting for premium companionship.' },
  'edgware-road': { title: 'Escorts in Edgware Road | Premium Companions | Virel', h1: 'Escorts in Edgware Road', description: 'Sophisticated companion services in Edgware Road, London. Discreet, elegant escorts in this central location.', content: 'Edgware Road offers a fascinating cultural tapestry in the heart of London, connecting the West End to the leafy streets of Little Venice and Maida Vale. Our companions here are cosmopolitan and culturally sophisticated.\n\nWith proximity to Hyde Park, Marble Arch, and Paddington, Edgware Road provides excellent access to many of London\'s finest locations.' },
  'euston': { title: 'Escorts in Euston | Premium Companions | Virel', h1: 'Escorts in Euston', description: 'Premium companion services in Euston, Central London. Professional, discreet escorts near major transport links.', content: 'Euston\'s central location and excellent transport connections make it ideal for visitors arriving from across the UK. Our Euston companions are professional, discreet, and perfectly suited to providing a warm welcome to London.\n\nWith Bloomsbury, Fitzrovia, and Regent\'s Park all within easy reach, Euston is an excellent base for exploring the capital.' },
  'fitzrovia': { title: 'Escorts in Fitzrovia | Cultured Companions | Virel', h1: 'Escorts in Fitzrovia', description: 'Cultured companion services in Fitzrovia, London. Sophisticated escorts in this creative media and arts district.', content: 'Fitzrovia\'s creative energy — home to media companies, design studios, and acclaimed restaurants — makes it one of Central London\'s most dynamic neighbourhoods. Our Fitzrovia companions are intelligent, creative, and engaging.\n\nFrom Charlotte Street\'s renowned restaurant scene to the nearby West End, Fitzrovia offers the perfect setting for a sophisticated evening.' },
  'fulham': { title: 'Escorts in Fulham | Premium Companions | Virel', h1: 'Escorts in Fulham', description: 'Premium companion services in Fulham, West London. Stylish, friendly escorts in this affluent residential area.', content: 'Fulham\'s leafy streets, riverside walks, and thriving restaurant scene make it one of West London\'s most desirable areas. Our Fulham companions are warm, sophisticated, and perfectly at home in this affluent neighbourhood.\n\nWith the Thames at its doorstep and excellent connections to Chelsea and Kensington, Fulham provides a beautiful backdrop for premium companionship.' },
  'gatwick-airport': { title: 'Escorts near Gatwick Airport | Premium Companions | Virel', h1: 'Escorts near Gatwick Airport', description: 'Discreet companion services near Gatwick Airport. Available for hotel visits and layovers. Prompt, professional service.', content: 'For travellers passing through Gatwick Airport, our companions provide a welcome respite during layovers or pre-flight evenings. Our Gatwick escorts are punctual, professional, and available at hotels throughout the area.\n\nAll our companions near Gatwick are experienced in airport hotel visits and understand the importance of discretion for travelling clients.' },
  'gloucester-road': { title: 'Escorts in Gloucester Road | Premium Companions | Virel', h1: 'Escorts in Gloucester Road', description: 'Elegant companion services in Gloucester Road, West London. Sophisticated escorts in this upscale Kensington area.', content: 'Gloucester Road sits in the heart of upscale South Kensington, surrounded by cultural institutions, beautiful gardens, and fine dining. Our companions here are cultured and sophisticated, perfectly suited to this prestigious postcode.\n\nWith the Natural History Museum, Victoria and Albert Museum, and Hyde Park all nearby, Gloucester Road provides an exceptional cultural backdrop.' },
  'hackney': { title: 'Escorts in Hackney | Creative Companions | Virel', h1: 'Escorts in Hackney', description: 'Creative companion services in Hackney, East London. Dynamic, engaging escorts in London\'s most vibrant creative hub.', content: 'Hackney has established itself as London\'s creative capital — home to artists, tech startups, and some of the city\'s most innovative restaurants and venues. Our Hackney companions share this creative, independent spirit.\n\nFrom London Fields to Broadway Market, Hackney\'s diverse offerings provide an exciting backdrop for memorable encounters with our companions.' },
  'hammersmith': { title: 'Escorts in Hammersmith | Premium Companions | Virel', h1: 'Escorts in Hammersmith', description: 'Premium companion services in Hammersmith, West London. Professional escorts near the Thames and major venues.', content: 'Hammersmith\'s riverside location, excellent transport links, and vibrant commercial centre make it one of West London\'s most accessible destinations. Our Hammersmith companions are professional and versatile.\n\nWith the Hammersmith Apollo, riverside restaurants, and easy access to Chiswick and Fulham, Hammersmith provides a great base for a memorable evening.' },
  'heathrow': { title: 'Escorts near Heathrow Airport | Premium Companions | Virel', h1: 'Escorts near Heathrow Airport', description: 'Discreet companion services near Heathrow Airport. Hotel visits and layover companionship. Available 24/7.', content: 'Our Heathrow companions provide a premium service for international travellers, available at hotels throughout the Heathrow area around the clock. Whether you\'re on a layover or arriving for an extended visit, our escorts provide a warm and discreet welcome.\n\nAll companions near Heathrow are experienced with airport hotel bookings and maintain absolute discretion for our international clientele.' },
  'holborn': { title: 'Escorts in Holborn | Premium Companions | Virel', h1: 'Escorts in Holborn', description: 'Professional companion services in Holborn, Central London. Sophisticated escorts near the City and West End.', content: 'Holborn sits at the junction of the City and the West End, making it one of London\'s most strategically positioned neighbourhoods. Our Holborn companions are professional, discreet, and perfectly suited to entertaining business visitors.\n\nWith world-class hotels, legal institutions, and proximity to both financial and entertainment districts, Holborn is ideal for corporate entertainment.' },
  'holland-park-avenue': { title: 'Escorts in Holland Park | Luxury Companions | Virel', h1: 'Escorts in Holland Park', description: 'Luxury companion services in Holland Park, West London. Exclusive escorts in one of London\'s most beautiful residential areas.', content: 'Holland Park\'s magnificent Victorian mansions, private gardens, and exclusive atmosphere create one of London\'s most beautiful residential settings. Our Holland Park companions embody this quiet luxury.\n\nWith the stunning Holland Park itself providing a green oasis in West London, and excellent proximity to Notting Hill and Kensington, this is an exceptional location for premium companionship.' },
  'hyde-park': { title: 'Escorts near Hyde Park | Premium Companions | Virel', h1: 'Escorts near Hyde Park', description: 'Premium companion services near Hyde Park, London. Elegant escorts near the Serpentine and luxury hotels.', content: 'Hyde Park\'s 350 acres of beautiful parkland sit at the heart of London\'s most prestigious neighbourhoods. Our companions near Hyde Park are available at the surrounding luxury hotels and private residences.\n\nFrom the Dorchester to the Mandarin Oriental, our escorts are familiar with Hyde Park\'s finest establishments and provide an impeccable service throughout the area.' },
  'islington': { title: 'Escorts in Islington | Premium Companions | Virel', h1: 'Escorts in Islington', description: 'Sophisticated companion services in Islington, North London. Cultured, engaging escorts in this vibrant area.', content: 'Islington\'s thriving restaurant scene, independent theatres, and beautiful Georgian architecture make it one of North London\'s most desirable destinations. Our Islington companions are cultured, warm, and engaging.\n\nFrom Upper Street\'s acclaimed restaurants to the Almeida Theatre, Islington offers a wealth of cultural experiences to share with our companions.' },
  'kensington': { title: 'Escorts in Kensington | Premium Companions | Virel', h1: 'Escorts in Kensington', description: 'Premium companion services in Kensington, London. Elegant, discreet escorts near the Royal Palace and museums.', content: 'Kensington offers a refined blend of culture, elegance, and sophistication. With world-class museums, beautiful gardens, and prestigious addresses, it\'s an ideal backdrop for our premium companion services.\n\nOur Kensington escorts embody the grace and refinement this distinguished neighbourhood is known for — perfect for cultural outings, fine dining, or private evenings.' },
  'kings-cross': { title: 'Escorts in Kings Cross | Premium Companions | Virel', h1: 'Escorts in Kings Cross', description: 'Premium companion services in Kings Cross, London. Sophisticated escorts in this transformed central neighbourhood.', content: 'Kings Cross has undergone a remarkable transformation into one of London\'s most dynamic neighbourhoods, home to world-class restaurants, galleries, and the iconic Coal Drops Yard. Our Kings Cross companions reflect this modern, cosmopolitan energy.\n\nWith excellent transport links and proximity to Islington, Bloomsbury, and the City, Kings Cross is perfectly positioned for a metropolitan experience.' },
  'knightsbridge': { title: 'Escorts in Knightsbridge | Luxury Companions | Virel', h1: 'Escorts in Knightsbridge', description: 'Luxury companion services in Knightsbridge. Home to Harrods and premium hotels, our escorts reflect the area\'s exclusivity.', content: 'Knightsbridge is home to Harrods, Harvey Nichols, and some of London\'s most exclusive hotels. Our companions in Knightsbridge are as luxurious as the surroundings — impeccably presented and utterly discreet.\n\nWith the Mandarin Oriental, Berkeley, and other world-class hotels within steps, our Knightsbridge escorts are experienced in delivering exceptional service.' },
  'lancaster-gate': { title: 'Escorts in Lancaster Gate | Premium Companions | Virel', h1: 'Escorts in Lancaster Gate', description: 'Premium companion services in Lancaster Gate, London. Elegant escorts near Hyde Park and Bayswater.', content: 'Lancaster Gate\'s elegant Victorian terraces overlook Hyde Park, creating one of London\'s most picturesque settings for premium companionship. Our escorts here are sophisticated and perfectly suited to the area\'s refined character.\n\nWith Hyde Park at the doorstep and proximity to Notting Hill and Bayswater, Lancaster Gate provides an excellent location for a memorable encounter.' },
  'leicester-square': { title: 'Escorts in Leicester Square | Premium Companions | Virel', h1: 'Escorts in Leicester Square', description: 'Premier companion services in Leicester Square, London\'s entertainment centre. Lively escorts for evenings in the West End.', content: 'Leicester Square sits at the heart of London\'s West End, surrounded by cinemas, restaurants, and theatres. Our Leicester Square companions are vibrant and entertaining — perfect partners for a night on the town.\n\nFrom pre-theatre dinners to late-night cocktails, Leicester Square\'s central location makes it ideal for a diverse and exciting evening with one of our companions.' },
  'london-bridge': { title: 'Escorts in London Bridge | Premium Companions | Virel', h1: 'Escorts in London Bridge', description: 'Sophisticated companion services in London Bridge. Stylish escorts near Borough Market and the Shard.', content: 'London Bridge combines historic charm with contemporary sophistication — home to Borough Market, the Shard, and some of the city\'s most acclaimed restaurants. Our London Bridge companions are stylish and dynamic.\n\nWith stunning views across the Thames and a wealth of world-class dining options, London Bridge provides an exceptional backdrop for premium companionship.' },
  'marble-arch': { title: 'Escorts in Marble Arch | Premium Companions | Virel', h1: 'Escorts in Marble Arch', description: 'Premium companion services in Marble Arch, Central London. Elegant escorts near Hyde Park and Oxford Street.', content: 'Marble Arch marks the northeastern corner of Hyde Park, positioned between the luxury of Park Lane and the shopping of Oxford Street. Our Marble Arch companions are sophisticated and versatile.\n\nWith the Dorchester and other Park Lane hotels nearby, and Hyde Park providing a beautiful green backdrop, Marble Arch is an excellent location for a premium experience.' },
  'marylebone': { title: 'Escorts in Marylebone | Premium Companions | Virel', h1: 'Escorts in Marylebone', description: 'Premium escort services in Marylebone. Sophisticated companions in this charming London village district.', content: 'Marylebone\'s village-like atmosphere combined with its central location makes it one of London\'s most desirable areas. Our companions here are warm, engaging, and perfectly suited to the neighbourhood\'s unique character.\n\nFrom the renowned restaurants of Marylebone High Street to the nearby Regent\'s Park, our escorts are ideal partners for exploring this wonderful area.' },
  'mayfair': { title: 'Escorts in Mayfair | Premium Companions | Virel', h1: 'Escorts in Mayfair', description: 'Discover elite companion services in Mayfair, London\'s most prestigious district. Verified, sophisticated companions.', content: 'Mayfair is synonymous with luxury and exclusivity. Home to some of London\'s finest hotels, restaurants, and residences, it\'s the perfect setting for an unforgettable experience with one of our premium companions.\n\nOur Mayfair escorts are carefully selected for their sophistication, elegance, and professionalism. Whether you\'re staying at The Dorchester, Claridge\'s, or The Connaught, our companions are perfectly suited.' },
  'notting-hill': { title: 'Escorts in Notting Hill | Stylish Companions | Virel', h1: 'Escorts in Notting Hill', description: 'Stylish companion services in Notting Hill. Fashionable, creative escorts in this colourful neighbourhood.', content: 'Notting Hill\'s bohemian charm, colourful houses, and famous market create a unique atmosphere unlike anywhere else in London. Our companions here reflect the area\'s creative, cosmopolitan spirit.\n\nFrom Portobello Road Market to the acclaimed restaurants of Westbourne Grove, Notting Hill offers a wealth of experiences to share with our companions.' },
  'oxford-street': { title: 'Escorts near Oxford Street | Premium Companions | Virel', h1: 'Escorts near Oxford Street', description: 'Premium companion services near Oxford Street, London. Central, accessible escorts for shopping and evenings out.', content: 'Oxford Street\'s central location in the heart of London\'s West End makes it one of the most accessible locations for our companion services. Our escorts near Oxford Street are perfectly situated for shopping trips, theatre visits, and evenings out.\n\nWith Mayfair to the south and Marylebone to the north, our companions provide easy access to some of London\'s finest neighbourhoods.' },
  'paddington': { title: 'Escorts in Paddington | Premium Companions | Virel', h1: 'Escorts in Paddington', description: 'Professional companion services in Paddington, London. Discreet escorts near major hotels and transport links.', content: 'Paddington\'s excellent transport links and concentration of business hotels make it an ideal location for visitors from across the UK and internationally. Our Paddington companions are professional, discreet, and available at hotels throughout the area.\n\nWith Little Venice nearby and easy access to Hyde Park and Bayswater, Paddington offers both practicality and beauty.' },
  'park-lane': { title: 'Escorts in Park Lane | Luxury Companions | Virel', h1: 'Escorts in Park Lane', description: 'Ultra-luxury companion services on Park Lane, London. Elite escorts at London\'s most prestigious hotel address.', content: 'Park Lane represents the pinnacle of London luxury — home to the Dorchester, Grosvenor House, and other iconic five-star hotels. Our Park Lane companions are among our most exceptional, selected to match the surroundings.\n\nFor clients at these world-class properties, we provide a level of service that matches the exceptional standards expected on London\'s most prestigious street.' },
  'peckham': { title: 'Escorts in Peckham | Vibrant Companions | Virel', h1: 'Escorts in Peckham', description: 'Vibrant companion services in Peckham, South London. Creative, dynamic escorts in this thriving neighbourhood.', content: 'Peckham has emerged as one of South London\'s most exciting destinations, with a thriving arts scene, acclaimed restaurants, and the famous Rooftop Film Club. Our Peckham companions are creative and full of personality.\n\nFrom Frank\'s Bar to the many acclaimed independent restaurants, Peckham offers a genuinely exciting backdrop for companionship.' },
  'queensway': { title: 'Escorts in Queensway | Premium Companions | Virel', h1: 'Escorts in Queensway', description: 'Cosmopolitan companion services in Queensway, London. Diverse, sophisticated escorts near Hyde Park and Bayswater.', content: 'Queensway\'s cosmopolitan character and central location make it a vibrant and accessible destination. Bordering Hyde Park and close to Notting Hill, our Queensway companions are diverse, engaging, and perfectly located.\n\nWith excellent restaurants, hotels, and proximity to some of London\'s most beautiful green spaces, Queensway offers a wonderful setting for a memorable experience.' },
  'shepherds-bush': { title: 'Escorts in Shepherds Bush | Premium Companions | Virel', h1: 'Escorts in Shepherds Bush', description: 'Premium companion services in Shepherds Bush, West London. Vibrant escorts near Westfield and the O2 Shepherd\'s Bush.', content: 'Shepherds Bush combines great transport links with a vibrant local character, home to Westfield London and the O2 Shepherd\'s Bush Empire. Our companions here are energetic and engaging.\n\nWith easy access to Holland Park, Hammersmith, and the A40, Shepherds Bush provides excellent connectivity for our companions to serve clients across West London.' },
  'shoreditch': { title: 'Escorts in Shoreditch | Creative Companions | Virel', h1: 'Escorts in Shoreditch', description: 'Creative companion services in Shoreditch, East London. Trendy, engaging escorts in London\'s creative capital.', content: 'Shoreditch is the epicentre of London\'s creative and tech scene — a dynamic neighbourhood of street art, rooftop bars, and innovative restaurants. Our Shoreditch companions embody this contemporary, creative energy.\n\nFrom Boxpark to the many acclaimed restaurants of Curtain Road, Shoreditch\'s unique character provides an exceptional backdrop for memorable companionship.' },
  'sloane-square': { title: 'Escorts in Sloane Square | Elegant Companions | Virel', h1: 'Escorts in Sloane Square', description: 'Elegant companion services in Sloane Square, London. Sophisticated escorts at the heart of Chelsea and Belgravia.', content: 'Sloane Square sits at the intersection of Chelsea and Belgravia, combining the best of both worlds — Chelsea\'s vibrancy and Belgravia\'s exclusivity. Our Sloane Square companions are refined and sophisticated.\n\nWith the Royal Court Theatre, the Saatchi Gallery, and some of London\'s finest restaurants on the doorstep, Sloane Square offers an exceptional cultural setting.' },
  'soho': { title: 'Escorts in Soho | Vibrant Companions | Virel', h1: 'Escorts in Soho', description: 'Dynamic companion services in Soho, London\'s entertainment hub. Lively, engaging escorts for evenings out.', content: 'Soho\'s energy is unmatched — a buzzing mix of restaurants, bars, theatres, and clubs. Our Soho companions are vivacious, fun, and perfect for an evening exploring London\'s most exciting neighbourhood.\n\nFrom pre-theatre dining to late-night cocktails, Soho\'s density of world-class entertainment makes it the perfect setting for a vibrant evening with one of our companions.' },
  'south-kensington': { title: 'Escorts in South Kensington | Premium Companions | Virel', h1: 'Escorts in South Kensington', description: 'Premium companion services in South Kensington, London. Cultured escorts near world-class museums and restaurants.', content: 'South Kensington\'s Museum Quarter — home to the V&A, Natural History Museum, and Science Museum — makes it one of London\'s most culturally rich neighbourhoods. Our companions here are sophisticated and well-travelled.\n\nWith exceptional restaurants along Old Brompton Road and beautiful garden squares, South Kensington provides a refined and cultured backdrop for premium companionship.' },
  'stratford': { title: 'Escorts in Stratford | Premium Companions | Virel', h1: 'Escorts in Stratford', description: 'Premium companion services in Stratford, East London. Modern escorts near Westfield Stratford and the Olympic Park.', content: 'Stratford\'s transformation since the 2012 Olympics has created one of London\'s most modern and dynamic neighbourhoods. With Westfield Stratford, the Aquatics Centre, and excellent transport links, our Stratford companions are ideally positioned.\n\nThe Queen Elizabeth Olympic Park provides a stunning backdrop, while excellent connections to Central London make Stratford a practical and vibrant location.' },
  'tottenham-court-road': { title: 'Escorts in Tottenham Court Road | Premium Companions | Virel', h1: 'Escorts in Tottenham Court Road', description: 'Central companion services near Tottenham Court Road. Sophisticated escorts in the heart of London\'s West End.', content: 'Tottenham Court Road sits at the heart of Central London, connecting the West End\'s entertainment district with the academic world of Bloomsbury. Our companions here are dynamic and well-connected to all of central London.\n\nWith Soho, Fitzrovia, and Covent Garden all within walking distance, Tottenham Court Road provides unparalleled access to London\'s finest entertainment and dining.' },
  'tower-hill': { title: 'Escorts in Tower Hill | Premium Companions | Virel', h1: 'Escorts in Tower Hill', description: 'Professional companion services in Tower Hill, City of London. Discreet escorts near the Tower of London and financial district.', content: 'Tower Hill\'s dramatic views of the Tower of London and proximity to the City financial district make it a unique London destination. Our Tower Hill companions are professional and accustomed to entertaining business clients.\n\nWith the Thames Path, world-class hotels, and easy access to London Bridge and Canary Wharf, Tower Hill offers an excellent base for City-focused companionship.' },
  'victoria': { title: 'Escorts in Victoria | Premium Companions | Virel', h1: 'Escorts in Victoria', description: 'Premium companion services in Victoria, London. Discreet escorts near Victoria Station and Buckingham Palace.', content: 'Victoria\'s central location — a short walk from Buckingham Palace, Westminster, and Belgravia — makes it one of London\'s most convenient destinations. Our Victoria companions are professional and discreet.\n\nWith major hotels including the Goring and Sofitel, and excellent connections across London, Victoria provides practical and prestigious settings for our companion services.' },
  'warren-street': { title: 'Escorts in Warren Street | Premium Companions | Virel', h1: 'Escorts in Warren Street', description: 'Sophisticated companion services in Warren Street, Central London. Elegant escorts near Fitzrovia and Regent\'s Park.', content: 'Warren Street\'s central location between the West End and Regent\'s Park makes it an excellent base for exploring London. Our Warren Street companions are versatile and easy to reach from across the city.\n\nWith Fitzrovia\'s acclaimed restaurant scene nearby and Regent\'s Park within reach, Warren Street offers a balanced and well-connected setting for premium companionship.' },
  'waterloo': { title: 'Escorts in Waterloo | Premium Companions | Virel', h1: 'Escorts in Waterloo', description: 'Premium companion services in Waterloo, South Bank, London. Sophisticated escorts near the Southbank cultural venues.', content: 'Waterloo\'s South Bank location places it at the heart of London\'s cultural scene — home to the National Theatre, Tate Modern, and the Royal Festival Hall. Our Waterloo companions are cultured and sophisticated.\n\nWith the Thames as a backdrop and some of London\'s finest cultural institutions within steps, Waterloo provides an exceptional setting for an intellectually and aesthetically rewarding evening.' },
  'wembley': { title: 'Escorts in Wembley | Premium Companions | Virel', h1: 'Escorts in Wembley', description: 'Professional companion services in Wembley, North London. Available for events at Wembley Stadium and Arena.', content: 'Wembley is home to the world-famous stadium and SSE Arena, hosting some of the world\'s biggest sporting and entertainment events. Our Wembley companions are perfect for event-night bookings and hotel visits in the area.\n\nWith the Hilton Wembley and other quality hotels nearby, our companions are experienced in providing professional services for event attendees.' },
  'west-end': { title: 'Escorts in the West End | Premium Companions | Virel', h1: 'Escorts in London\'s West End', description: 'Premium companion services in London\'s West End. Sophisticated escorts for theatre, dining, and nightlife.', content: 'The West End is London at its most vibrant and exciting — world-class theatres, Michelin-starred restaurants, luxury shopping, and iconic nightlife. Our West End companions are selected for their ability to enhance any occasion.\n\nWhether attending a show in the Theatre District, dining in Soho, or exploring the boutiques of Bond Street, our companions are the perfect partners for a quintessentially London experience.' },
  'westminster': { title: 'Escorts in Westminster | Discreet Companions | Virel', h1: 'Escorts in Westminster', description: 'Discreet companion services in Westminster, London. Professional escorts for business and leisure.', content: 'Westminster is the heart of London — political, historical, and iconic. Our Westminster companions are professionals who understand discretion is paramount in this prominent district.\n\nWith Parliament, Buckingham Palace, and Westminster Abbey nearby, and excellent hotels throughout the area, Westminster provides a prestigious backdrop for premium companionship.' },
  'wimbledon': { title: 'Escorts in Wimbledon | Premium Companions | Virel', h1: 'Escorts in Wimbledon', description: 'Premium companion services in Wimbledon, South West London. Elegant escorts in this prestigious residential area.', content: 'Wimbledon\'s village-like atmosphere, famous tennis championships, and beautiful common make it one of South West London\'s most desirable destinations. Our Wimbledon companions are elegant and refined.\n\nWhether visiting during the tennis season or at any time of year, our Wimbledon escorts provide a premium service in this prestigious and picturesque neighbourhood.' },
}

interface Props { params: { district: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const info = DISTRICTS[params.district]
  if (!info) return { title: 'Not Found', robots: { index: false, follow: false } }
  return {
    title: info.title,
    description: info.description,
    robots: { index: true, follow: true },
    alternates: { canonical: `/escorts-in-${params.district}` },
    openGraph: { title: info.title, description: info.description },
  }
}

export default async function DistrictPage({ params }: Props) {
  const info = DISTRICTS[params.district]
  if (!info) notFound()

  const districtName = params.district
    .split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const location = await prisma.location.findFirst({
    where: { slug: params.district, status: 'active' },
  })

  const models = await prisma.model.findMany({
    where: {
      status: 'active',
      visibility: 'public',
      ...(location ? { primaryLocationId: location.id } : {}),
    },
    include: {
      stats: true,
      media: { where: { isPrimary: true, isPublic: true }, take: 1 },
      primaryLocation: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: info.h1,
        description: info.description,
        areaServed: { '@type': 'Place', name: `${districtName}, London` },
        provider: { '@type': 'Organization', name: 'Virel', url: 'https://virel-v3.vercel.app' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: `How do I book an escort in ${districtName}?`, acceptedAnswer: { '@type': 'Answer', text: 'Browse our available companions, select your preferred escort, and submit a booking request. We confirm within 30 minutes.' } },
          { '@type': 'Question', name: `Are ${districtName} escorts available for outcall?`, acceptedAnswer: { '@type': 'Answer', text: `Yes, most companions offer both incall and outcall in ${districtName} and surrounding areas.` } },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://virel-v3.vercel.app' },
          { '@type': 'ListItem', position: 2, name: 'London Escorts', item: 'https://virel-v3.vercel.app/london-escorts' },
          { '@type': 'ListItem', position: 3, name: info.h1, item: `https://virel-v3.vercel.app/escorts-in-${params.district}` },
        ],
      },
    ],
  }

  const otherDistricts = Object.keys(DISTRICTS).filter(d => d !== params.district).slice(0, 12)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .dst-root { font-family:'DM Sans',sans-serif; background:#080808; color:#ddd5c8; min-height:100vh; }
        .model-card { text-decoration:none; display:block; overflow:hidden; position:relative; }
        .model-card img { width:100%; aspect-ratio:3/4; object-fit:cover; transition:transform .6s; }
        .model-card:hover img { transform:scale(1.04); }
        .model-card-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%); }
        .model-card-info { position:absolute; bottom:0; padding:20px; }
        .faq-item summary { list-style:none; cursor:pointer; padding:20px 24px; display:flex; justify-content:space-between; align-items:center; font-size:14px; color:#ddd5c8; }
        .faq-item summary::-webkit-details-marker { display:none; }
        .faq-item[open] summary { color:#c9a84c; }
        .faq-item summary .arr { transition:transform .25s; font-size:10px; color:#6b6560; }
        .faq-item[open] summary .arr { transform:rotate(180deg); }
        .dist-link { display:block; padding:14px 16px; border:1px solid rgba(255,255,255,0.07); font-size:12px; color:#6b6560; text-decoration:none; text-align:center; transition:border-color .2s,color .2s; letter-spacing:.04em; }
        .dist-link:hover { border-color:rgba(201,168,76,0.3); color:#c9a84c; }
        .book-btn { display:inline-block; background:#c9a84c; color:#080808; padding:16px 36px; font-size:11px; letter-spacing:.16em; text-transform:uppercase; text-decoration:none; font-weight:500; transition:background .2s; }
        .book-btn:hover { background:#e0be6a; }
        @media(max-width:600px){ .dst-hero,.dst-body{padding-left:20px!important;padding-right:20px!important;} }
      `}</style>

      <div className="dst-root">
        <Header />

        {/* Breadcrumb */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 40px', fontSize: 11, letterSpacing: '.1em', color: '#3a3530', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <Link href="/" style={{ color: '#3a3530', textDecoration: 'none' }}>HOME</Link>
          <span style={{ margin: '0 12px' }}>—</span>
          <Link href="/london-escorts" style={{ color: '#3a3530', textDecoration: 'none' }}>COMPANIONS</Link>
          <span style={{ margin: '0 12px' }}>—</span>
          <span style={{ color: '#c9a84c' }}>{districtName.toUpperCase()}</span>
        </div>

        {/* Hero */}
        <div className="dst-hero" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px 64px' }}>
          <p style={{ fontSize: 10, letterSpacing: '.3em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 20 }}>London Escorts</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(48px,6vw,80px)', fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px', lineHeight: 1.05 }}>
            {info.h1.replace('Escorts in ', '').replace("Escorts in London's ", "London's ")}<br />
            <em style={{ fontStyle: 'italic', color: '#c9a84c' }}>Companions</em>
          </h1>
          <p style={{ fontSize: 15, color: '#6b6560', maxWidth: 560, lineHeight: 1.8, margin: '0 0 40px' }}>{info.description}</p>
          <Link href="/london-escorts" className="book-btn">Browse All Companions</Link>
        </div>

        {/* Models grid */}
        {models.length > 0 && (
          <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 32 }}>
              <p style={{ fontSize: 10, letterSpacing: '.25em', color: '#c9a84c', textTransform: 'uppercase', margin: 0 }}>
                Available in {districtName}
              </p>
              <Link href="/london-escorts" style={{ fontSize: 11, letterSpacing: '.1em', color: '#3a3530', textDecoration: 'none', textTransform: 'uppercase' }}>View All →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 2, background: 'rgba(255,255,255,0.03)' }}>
              {models.map((model: any) => {
                const photo = model.media[0]?.url
                return (
                  <Link key={model.id} href={`/catalog/${model.slug}`} className="model-card">
                    {photo
                      ? <img src={photo} alt={model.name} loading="lazy" />
                      : <div style={{ aspectRatio: '3/4', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>👤</div>
                    }
                    <div className="model-card-overlay" />
                    <div className="model-card-info">
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: '#f0e8dc', margin: '0 0 4px' }}>{model.name}</p>
                      {model.stats?.age && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{model.stats.age} yrs</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.15),transparent)', maxWidth: 1200, margin: '0 auto' }} />

        {/* Content + FAQ */}
        <div className="dst-body" style={{ maxWidth: 780, margin: '0 auto', padding: '80px 40px' }}>
          {/* Area description */}
          <div style={{ marginBottom: 64 }}>
            {info.content.split('\n\n').map((para: string, i: number) => (
              <p key={i} style={{ fontSize: 15, color: '#6b6560', lineHeight: 1.9, marginBottom: 20 }}>{para}</p>
            ))}
          </div>

          {/* FAQ */}
          <p style={{ fontSize: 10, letterSpacing: '.25em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 24 }}>FAQ</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(255,255,255,0.04)' }}>
            {[
              { q: `How do I book an escort in ${districtName}?`, a: `Browse our available companions, select your preferred escort, and submit a booking request. We confirm within 30 minutes.` },
              { q: `Are escorts in ${districtName} available for outcall?`, a: `Yes, most companions offer both incall and outcall in ${districtName} and surrounding areas.` },
              { q: `Is the service discreet in ${districtName}?`, a: `Absolutely. All communications and bookings are handled with complete confidentiality. We never share client information.` },
            ].map((faq, i) => (
              <details key={i} className="faq-item" style={{ background: '#080808' }}>
                <summary>
                  <span>{faq.q}</span>
                  <span className="arr">▾</span>
                </summary>
                <p style={{ fontSize: 14, color: '#6b6560', lineHeight: 1.8, margin: 0, padding: '0 24px 20px' }}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Other districts */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 100px' }}>
          <p style={{ fontSize: 10, letterSpacing: '.25em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: 24 }}>Other London Areas</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 1, background: 'rgba(255,255,255,0.04)' }}>
            {otherDistricts.map(d => {
              const name = d.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
              return (
                <Link key={d} href={`/escorts-in-${d}`} className="dist-link">{name}</Link>
              )
            })}
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
