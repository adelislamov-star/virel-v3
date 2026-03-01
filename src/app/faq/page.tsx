import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'FAQ | Virel London Escorts',
  description: 'Frequently asked questions about booking a companion with Virel. Booking process, payments, privacy, cancellations and more.',
  alternates: { canonical: 'https://virel-v3.vercel.app/faq' },
}

const FAQS = [
  {
    category: 'How It Works: The Booking Process',
    items: [
      {
        q: 'How do I book a meeting?',
        a: 'Booking with us is a straightforward and discreet process designed for your convenience. You can initiate a booking in two ways: by filling out the secure form on our website or by calling our client management team directly. The form is available 24/7, allowing you to make a request at a time that suits you. For a more immediate response or to discuss specific arrangements, a phone call is often the most efficient method. Our team is trained to handle your enquiry with professionalism and care, ensuring all details are captured accurately. Once your request is received, we begin coordinating with your chosen companion to confirm their availability for your preferred time and location.',
      },
      {
        q: 'What information do I need to provide for booking?',
        a: 'To ensure a smooth and secure booking process for everyone, we require a few basic details. We ask for your first name, a valid contact phone number, and an email address for confirmation. For outcall meetings, we will also need the full address of the location, such as your residence or hotel room number. We request the minimum information necessary to coordinate the meeting and maintain a secure environment for both you and our companions. This data is used exclusively for the purpose of arranging your booking and is handled with the utmost respect for your privacy. We never use this information for marketing purposes.',
      },
      {
        q: 'How quickly will I get a confirmation?',
        a: 'We pride ourselves on a prompt and efficient service. Our goal is to provide you with a confirmation as swiftly as possible. Typically, after you submit a booking request, our team immediately contacts the companion to check their availability. For bookings made during our standard operating hours (10 am – 1 am), you can expect to receive a confirmation call or email, usually within 30 to 60 minutes. For requests made outside these hours, we will respond as soon as our office reopens the following morning.',
      },
      {
        q: 'Can I book for the same day?',
        a: 'Yes, we accommodate same-day bookings and understand that spontaneity can be part of the experience. We recommend contacting us as early as possible on the day to ensure the best availability of your preferred companion. While we always do our best to fulfil last-minute requests, availability can be limited, especially during peak times or with our most in-demand companions. A few hours of advance notice significantly increases the likelihood of securing your desired arrangement without compromise.',
      },
      {
        q: 'Are the photos on the website genuine?',
        a: 'Authenticity is a cornerstone of our agency\'s reputation. We are committed to ensuring that the companions you see on our website are the individuals you will meet. All companions undergo a verification process, and we require that their portfolio images are recent and accurately represent their current appearance. We understand that trust begins with transparency, and misrepresentation undermines that trust. Our aim is for you to make your choice with confidence, assured that the person who arrives is the same individual presented on our website.',
      },
    ],
  },
  {
    category: 'Deposits & Payments',
    items: [
      {
        q: 'Why is a deposit required for some bookings?',
        a: 'A deposit serves as a mutual commitment and is typically requested only for extended bookings, first-time clients, or arrangements involving significant travel. Its purpose is to provide security for both you and the companion. For the companion, it confirms the client\'s firm intention to proceed, compensating for the time they have reserved and the other bookings they may have declined. For you, it secures your chosen companion for a specific date and time, ensuring they are committed to your arrangement.',
      },
      {
        q: 'How is my deposit protected?',
        a: 'Your deposit is a trust-based financial commitment, and we treat it with the highest level of responsibility. When you pay a deposit, it is held by the agency as a safeguard for the booking. It is not disbursed until after the meeting is successfully completed. In the rare event of a cancellation initiated by the agency or the companion, your deposit is fully and immediately refundable. This transparent approach ensures your funds are protected and that you are not financially disadvantaged by circumstances outside of your control.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'To ensure discretion and simplicity, our primary method of payment is cash, paid directly to the companion at the beginning of your meeting. We accept British Pounds (GBP), and some companions may also accept Euros (EUR) or US Dollars (USD), which should be confirmed at the time of booking. For deposits, we facilitate secure bank transfers. We currently do not process credit card payments directly for the final balance, to minimise the data we hold and protect your financial privacy.',
      },
      {
        q: 'When is the final balance paid?',
        a: 'The final balance for the meeting is settled at the very beginning. Upon the companion\'s arrival, you are asked to present the agreed-upon fee in cash. This practice is standard and serves to handle the financial aspect of the arrangement upfront, allowing the rest of the time to be focused on companionship without business formalities. It provides peace of mind for both you and the companion, confirming that all obligations are met from the outset.',
      },
    ],
  },
  {
    category: 'Screening & Safety',
    items: [
      {
        q: 'What is your screening process and why does it exist?',
        a: 'Our screening process exists to create a safe and professional environment for our companions. We may request basic verifiable information from new clients, such as a social media profile or a professional reference. This process is not about distrust, but about establishing a framework of accountability and safety. Our companions\' wellbeing is our priority, and a brief screening process significantly contributes to their security and confidence. We handle all information collected during this process with complete discretion and it is never used for any other purpose.',
      },
      {
        q: 'What happens if I feel uncomfortable during a meeting?',
        a: 'Your comfort and safety are paramount. If at any point during a meeting you feel uncomfortable or that the boundaries of the agreed arrangement are not being respected, you have the absolute right to end the meeting. We encourage open and respectful communication from the outset to establish mutual expectations. Should a situation arise that cannot be resolved, you should politely and calmly end the appointment and inform the agency afterwards so we can take appropriate action.',
      },
    ],
  },
  {
    category: 'Cancellations & Changes',
    items: [
      {
        q: 'What happens if I need to cancel or reschedule my booking?',
        a: 'We understand that plans can change. If you need to cancel or reschedule, we ask that you provide us with as much notice as possible. For cancellations made with more than 24 hours\' notice, there is generally no financial penalty. For cancellations made with less notice, a fee may be applicable to compensate the companion for the time they had reserved. Please call us directly to discuss any changes to your arrangements.',
      },
      {
        q: 'What is your policy if the agency or escort needs to cancel?',
        a: 'In the rare event that a companion must cancel due to illness or an emergency, we will notify you immediately. Our first priority will be to offer you a suitable alternative companion for the same time slot. If we are unable to find a replacement that meets your satisfaction, any deposit you have paid will be refunded in full without delay. Your trust is important to us, and we would never leave you in a difficult position due to a cancellation on our part.',
      },
      {
        q: 'Is the deposit refundable if I cancel?',
        a: 'The refundability of a deposit depends on the timing of your cancellation. If you cancel with more than 48 hours\' notice, your deposit is typically fully refundable or can be held for a future booking. If you cancel within 48 hours of the agreed meeting time, the deposit is usually non-refundable, as the companion has reserved that time exclusively for you and has likely declined other opportunities.',
      },
      {
        q: 'What is the policy for no-shows or very late cancellations?',
        a: 'A no-show or cancellation made with very little notice creates a significant disruption for the companion. In such cases, any deposit paid will be forfeited. For clients with a history of last-minute cancellations, we may require full prepayment for future bookings. This policy is not intended to be punitive, but to ensure the reliability of the service for all parties. Clear communication and timely notice are key to maintaining a respectful relationship.',
      },
    ],
  },
  {
    category: 'Privacy & Discretion',
    items: [
      {
        q: 'How do you protect my personal information?',
        a: 'Protecting your privacy is a fundamental principle of our agency. We collect only the essential information required to arrange your booking. This data is stored securely on encrypted systems with strictly limited access. Our team is trained in data protection and bound by confidentiality agreements. We do not share your information with any third parties for marketing or other purposes. Our entire process is built around the trust you place in us.',
      },
      {
        q: 'How long do you keep my booking data?',
        a: 'Our data retention policy is guided by the principle of minimalism. We keep the details of your booking only for as long as is necessary to successfully manage the appointment and for a short period afterwards to handle any post-booking queries. After this period, typically 72 hours, all personally identifiable information related to the booking is permanently deleted from our active systems. We do not maintain a long-term database of client information.',
      },
      {
        q: 'Will I ever receive marketing emails or calls from you?',
        a: 'Absolutely not. We have a strict no-marketing policy. Your contact information is used exclusively for operational communication related to your bookings. We will never use your phone number or email address to send you promotional materials, newsletters, or unsolicited offers. You can be confident that your relationship with us remains private and that your inbox will not be filled with unwanted communications from our agency.',
      },
    ],
  },
  {
    category: 'Responsibilities & Expectations',
    items: [
      {
        q: 'What are the mutual expectations for conduct during a meeting?',
        a: 'A successful meeting is built on a foundation of mutual respect. We expect our clients to treat our companions with courtesy, as you would any professional. This includes being punctual, hygienic, and communicating clearly and respectfully. In return, our companions are expected to be professional, discreet, and to provide the high standard of companionship you expect. Any form of abusive, disrespectful, or illegal behaviour from either party is unacceptable and will result in the immediate termination of the meeting.',
      },
      {
        q: 'What is the agency\'s role and responsibility?',
        a: 'Our role as an agency extends beyond simply making introductions. We are responsible for creating and maintaining a safe, professional, and reliable framework for both our clients and companions. This includes verifying the identity and professionalism of our companions, managing the booking process with efficiency and discretion, and providing clear policies on payments, cancellations, and conduct. We act as a trusted intermediary and are your point of contact for any issues that may arise.',
      },
    ],
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.flatMap(section =>
    section.items.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    }))
  ),
}

export default function FAQPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .faq-root { font-family:'DM Sans',sans-serif; background:#080808; color:#ddd5c8; min-height:100vh; }
        .faq-bc { font-size:11px; letter-spacing:.1em; color:#3a3530; padding:20px 40px; border-bottom:1px solid rgba(255,255,255,0.04); }
        .faq-bc a { color:#3a3530; text-decoration:none; }
        .faq-bc a:hover { color:#c9a84c; }

        .faq-inner { max-width:860px; margin:0 auto; padding:80px 40px 100px; }
        @media(max-width:600px){ .faq-inner{padding:60px 20px 80px;} }
        .f-eyebrow { font-size:10px; letter-spacing:.25em; color:#c9a84c; text-transform:uppercase; display:block; margin-bottom:16px; }
        .f-title { font-family:'Cormorant Garamond',serif; font-size:clamp(40px,6vw,68px); font-weight:300; color:#f0e8dc; margin:0 0 16px; line-height:1.05; }
        .f-title em { font-style:italic; color:#c9a84c; }
        .f-subtitle { font-size:14px; color:#6b6560; line-height:1.9; margin:0 0 72px; }

        .faq-section { margin-bottom:56px; }
        .faq-section-title { font-size:10px; letter-spacing:.22em; color:#c9a84c; text-transform:uppercase; margin-bottom:20px; padding-bottom:14px; border-bottom:1px solid rgba(201,168,76,0.15); }

        .faq-list { display:flex; flex-direction:column; }
        .faq-item { border-bottom:1px solid rgba(255,255,255,0.05); }
        .faq-q { padding:22px 0; cursor:pointer; font-size:15px; color:#ddd5c8; list-style:none; display:flex; justify-content:space-between; align-items:center; gap:24px; }
        .faq-q::-webkit-details-marker { display:none; }
        .faq-plus { color:#c9a84c; font-size:20px; font-weight:300; flex-shrink:0; width:16px; text-align:center; transition:transform .25s; line-height:1; }
        details[open] .faq-plus { transform:rotate(45deg); }
        .faq-a { padding:0 32px 22px 0; font-size:13px; color:#6b6560; line-height:2.1; }

        .f-cta { border:1px solid rgba(255,255,255,0.07); padding:40px; text-align:center; margin-top:64px; }
        .f-cta-title { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:300; color:#f0e8dc; margin:0 0 10px; }
        .f-cta-text { font-size:13px; color:#6b6560; margin:0 0 24px; }
        .f-cta-link { font-size:11px; letter-spacing:.16em; color:#c9a84c; text-decoration:none; text-transform:uppercase; border:1px solid rgba(201,168,76,0.3); padding:12px 28px; display:inline-block; transition:all .2s; }
        .f-cta-link:hover { background:rgba(201,168,76,0.06); border-color:#c9a84c; }
      `}</style>

      <div className="faq-root">
        <Header />

        <div className="faq-bc">
          <Link href="/">HOME</Link>
          <span style={{ margin: '0 12px' }}>—</span>
          <span style={{ color: '#c9a84c' }}>FAQ</span>
        </div>

        <div className="faq-inner">
          <span className="f-eyebrow">Questions & Answers</span>
          <h1 className="f-title">Frequently <em>Asked</em></h1>
          <p className="f-subtitle">Everything you need to know about booking with Virel.</p>

          {FAQS.map(section => (
            <div key={section.category} className="faq-section">
              <p className="faq-section-title">{section.category}</p>
              <div className="faq-list">
                {section.items.map((faq, i) => (
                  <details key={i} className="faq-item">
                    <summary className="faq-q">
                      <span>{faq.q}</span>
                      <span className="faq-plus">+</span>
                    </summary>
                    <p className="faq-a">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <div className="f-cta">
            <p className="f-cta-title">Still have questions?</p>
            <p className="f-cta-text">Our team is available 24/7 to assist you.</p>
            <Link href="/contact" className="f-cta-link">Contact Us →</Link>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
