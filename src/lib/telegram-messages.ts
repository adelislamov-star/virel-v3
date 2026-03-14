export function newBookingRequestMessage(data: {
  clientName: string
  clientPhone: string
  preferredContact: string
  clientTelegramId?: string | null
  modelName: string | null
  formattedDate: string
  durationLabel: string
  callType: string
  hotelName?: string | null
  roomNumber?: string | null
  districtName?: string | null
  grandTotal: number
  selectedExtras: Array<{ name?: string; price: number }>
  specialRequests?: string | null
  restaurantNeeded: boolean
  transportNeeded: boolean
  requestId: string
}): string {
  const extras = data.selectedExtras.length
    ? data.selectedExtras.map(e => `${e.name ?? 'Extra'} +\u00A3${e.price}`).join(', ')
    : null

  const location =
    data.callType === 'outcall'
      ? [data.hotelName, data.roomNumber ? `Room ${data.roomNumber}` : null, data.districtName]
          .filter(Boolean)
          .join(', ')
      : 'Incall'

  return `\u{1F195} *New Booking Request*

\u{1F464} *Client:* ${data.clientName}
\u{1F4F1} *Phone:* ${data.clientPhone}
\u{1F4AC} *Contact:* via ${data.preferredContact}${data.clientTelegramId ? `\n\u2708\uFE0F *Telegram:* @${data.clientTelegramId}` : ''}

\u{1F484} *Companion:* ${data.modelName ?? 'Any available'}
\u{1F4C5} *Date:* ${data.formattedDate}
\u23F1 *Duration:* ${data.durationLabel}
\u{1F3E0} *Type:* ${location}

\u{1F4B0} *Total:* \u00A3${data.grandTotal}${extras ? `\n\u2728 *Extras:* ${extras}` : ''}${data.specialRequests ? `\n\u{1F4DD} *Notes:* ${data.specialRequests}` : ''}${data.restaurantNeeded ? '\n\u{1F37D} Restaurant needed' : ''}${data.transportNeeded ? '\n\u{1F697} Transport needed' : ''}

\u{1F516} *Ref:* #VRL\\-${data.requestId.slice(0, 8).toUpperCase()}`
}

export function bookingConfirmedMessage(data: {
  clientName: string
  clientPhone: string
  modelName: string | null
  formattedDate: string
  durationLabel: string
  grandTotal: number
  confirmedByName: string
  requestId: string
}): string {
  return `\u2705 *Booking Confirmed*

\u{1F464} ${data.clientName} \u2014 ${data.clientPhone}
\u{1F484} ${data.modelName ?? 'Any'}
\u{1F4C5} ${data.formattedDate} \u00B7 ${data.durationLabel}
\u{1F4B0} \u00A3${data.grandTotal}

Confirmed by: ${data.confirmedByName}
\u{1F516} #VRL\\-${data.requestId.slice(0, 8).toUpperCase()}`
}

export function bookingReminder30Message(data: {
  modelName: string | null
  clientName: string
  clientPhone: string
  callType: string
  location: string | null
  durationLabel: string
  grandTotal: number
}): string {
  return `\u23F0 *30 Minute Reminder*

\u{1F484} ${data.modelName ?? 'Companion'} \u2192 ${data.clientName}
\u{1F4F1} ${data.clientPhone}
\u{1F3E0} ${data.callType}: ${data.location ?? 'Incall'}
\u23F1 ${data.durationLabel} \u00B7 \u{1F4B0} \u00A3${data.grandTotal}`
}

export function bookingReminder2hMessage(data: {
  clientName: string
  clientPhone: string
  modelName: string | null
  formattedDate: string
  callType: string
  location: string | null
}): string {
  return `\u{1F514} *2 Hour Reminder*

Upcoming booking in 2 hours:
${data.modelName ?? 'Companion'} \u2192 ${data.clientName}
\u{1F4F1} ${data.clientPhone}
\u{1F4C5} ${data.formattedDate}
\u{1F3E0} ${data.callType}${data.location ? `: ${data.location}` : ''}`
}

export function criticalAlertMessage(message: string): string {
  return `\u{1F6A8} *CRITICAL ALERT*\n\n${message}`
}
