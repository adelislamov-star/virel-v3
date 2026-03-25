'use client'

import { createContext, useContext, useState } from 'react'
import { BookingModal } from './BookingModal'

const BookingModalContext = createContext<{ openModal: () => void }>({
  openModal: () => {},
})

export function useBookingModal() {
  return useContext(BookingModalContext)
}

export function BookingModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <BookingModalContext.Provider value={{ openModal: () => setIsOpen(true) }}>
      {children}
      <BookingModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </BookingModalContext.Provider>
  )
}
