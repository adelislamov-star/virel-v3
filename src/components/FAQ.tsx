'use client'

import { useState } from 'react'

const faqs = [
  {
    question: 'How do I make a booking?',
    answer: 'Browse our companions, select your preferred companion, and click the "Book Now" button on their profile. Fill in the booking form with your details, preferred date and time. You\'ll receive confirmation within minutes via email or phone.',
  },
  {
    question: 'Are all photos verified and authentic?',
    answer: 'Yes, absolutely. All photos on our platform are 100% verified and authentic. We take verification seriously to ensure transparency and trust. Every companion profile displays only genuine, recent photos.',
  },
  {
    question: 'What areas do you serve in London?',
    answer: 'We provide services across all premium London districts including Mayfair, Kensington, Knightsbridge, Chelsea, Belgravia, Marylebone, Westminster, Notting Hill, Soho, Covent Garden, Canary Wharf, and City of London.',
  },
  {
    question: 'Is the service discreet and confidential?',
    answer: 'Your privacy is our absolute priority. All bookings are handled with complete discretion and confidentiality. We never share client information and all communication is encrypted and secure.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept cash, bank transfers, and major credit cards. All transactions are processed securely. Payment details are required at booking confirmation.',
  },
  {
    question: 'Can I cancel or reschedule my booking?',
    answer: 'Yes, you can cancel or reschedule up to 24 hours before your booking without penalty. Cancellations made less than 24 hours before are subject to a 50% fee. Please contact us as soon as possible if you need to make changes.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // JSON-LD Schema for FAQ
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-border rounded-lg overflow-hidden"
          >
            <button
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span className="font-semibold">{faq.question}</span>
              <svg
                className={`w-5 h-5 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 text-muted-foreground">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
