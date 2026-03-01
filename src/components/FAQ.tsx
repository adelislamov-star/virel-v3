'use client'

import { useState } from 'react'

const faqs = [
  {
    question: 'How do I book a meeting?',
    answer: 'Booking with us is a straightforward and discreet process. You can initiate a booking by filling out the secure form on our website or by calling our client management team directly. The form is available 24/7. For a more immediate response, a phone call is often the most efficient method. Once your request is received, we begin coordinating with your chosen companion to confirm availability for your preferred time and location.',
  },
  {
    question: 'Are the photos on the website genuine?',
    answer: 'Authenticity is a cornerstone of our agency\'s reputation. All companions undergo a verification process, and we require that their portfolio images are recent and accurately represent their current appearance. Our aim is for you to make your choice with confidence, assured that the person who arrives is the same individual presented on our website.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'Our primary method of payment is cash, paid directly to the companion at the beginning of your meeting. We accept British Pounds (GBP), and some companions may also accept Euros or US Dollars — confirm at the time of booking. For deposits, we facilitate secure bank transfers. We do not process credit card payments for the final balance to protect your financial privacy.',
  },
  {
    question: 'Is the service discreet and confidential?',
    answer: 'Protecting your privacy is a fundamental principle of our agency. We collect only the essential information required to arrange your booking, stored on encrypted systems with strictly limited access. We do not share your information with any third parties, and we have a strict no-marketing policy — your contact details are used solely for operational communication related to your booking.',
  },
  {
    question: 'What happens if I need to cancel or reschedule?',
    answer: 'We ask that you provide as much notice as possible. For cancellations with more than 24 hours\' notice, there is generally no financial penalty. For cancellations with less notice, a fee may be applicable to compensate the companion for time reserved. In the rare event that we or the companion must cancel, you will be notified immediately and any deposit refunded in full.',
  },
  {
    question: 'How long do you keep my booking data?',
    answer: 'Our data retention policy is guided by minimalism. We keep booking details only for as long as necessary — typically 72 hours after the appointment, after which all personally identifiable information is permanently deleted. We do not maintain a long-term database of client information. Your association with our agency is not stored indefinitely.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {faqs.map((faq, index) => (
          <div
            key={index}
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <button
              style={{
                width: '100%', padding: '22px 0', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                gap: 24, background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', color: '#ddd5c8', fontSize: 15,
              }}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span>{faq.question}</span>
              <span style={{
                color: '#c9a84c', fontSize: 20, fontWeight: 300, flexShrink: 0,
                transition: 'transform .25s',
                transform: openIndex === index ? 'rotate(45deg)' : 'none',
                lineHeight: 1,
              }}>+</span>
            </button>
            {openIndex === index && (
              <p style={{
                padding: '0 32px 22px 0', fontSize: 13,
                color: '#6b6560', lineHeight: 2.1, margin: 0,
              }}>
                {faq.answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
