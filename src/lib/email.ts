import { Resend } from 'resend'
import { siteConfig } from '@/../config/site'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// ── Base sender ─────────────────────────────────────────────────────────
export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  if (!resend) {
    console.log('[EMAIL] Not configured — would send:', params.subject, '→', params.to)
    return false
  }
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? siteConfig.email,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    return true
  } catch (err) {
    console.error('[EMAIL] Failed to send:', err)
    return false
  }
}

// ── Brand wrapper ───────────────────────────────────────────────────────
function vaurelEmail(body: string): string {
  return `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 40px;">
  <div style="border-bottom: 1px solid #c9a96e; padding-bottom: 20px; margin-bottom: 32px;">
    <h1 style="color: #c9a96e; font-size: 28px; margin: 0; letter-spacing: 4px;">VAUREL</h1>
    <p style="color: #888; margin: 4px 0 0; font-size: 12px; letter-spacing: 2px;">LONDON'S PREMIER COMPANION AGENCY</p>
  </div>
  ${body}
  <p style="color: #666; font-size: 12px; line-height: 1.8; margin-top: 32px; border-top: 1px solid #222; padding-top: 24px;">
    All services are for companionship only. Any activities between consenting adults are a matter of personal choice.<br><br>
    &copy; 2026 ${siteConfig.name} London. Strictly confidential.
  </p>
</div>`
}

function summaryBlock(fields: Array<{ label: string; value: string }>): string {
  const rows = fields
    .filter(f => f.value)
    .map(f => `<p style="margin: 8px 0;"><span style="color: #888;">${f.label}:</span> <strong>${f.value}</strong></p>`)
    .join('\n    ')
  return `<div style="background: #111; border: 1px solid #333; border-left: 3px solid #c9a96e; border-radius: 4px; padding: 24px; margin: 24px 0;">
    <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px;">Booking Summary</p>
    ${rows}
  </div>`
}

function refBlock(requestId: string): string {
  const short = requestId.slice(0, 8).toUpperCase()
  return `<div style="border-top: 1px solid #333; margin-top: 16px; padding-top: 16px;">
    <p style="margin: 0; color: #666; font-size: 12px;">Reference: <strong style="color: #e5e5e5;">#VRL-${short}</strong></p>
  </div>`
}

// ── Template functions ──────────────────────────────────────────────────

export async function sendBookingReceived(data: {
  to: string
  clientName: string
  modelName: string | null
  formattedDate: string
  durationLabel: string
  callType: string
  grandTotal: number
  currency: string
  preferredContact: string
  requestId: string
}): Promise<boolean> {
  const fields = [
    ...(data.modelName ? [{ label: 'Companion', value: data.modelName }] : []),
    { label: 'Date', value: data.formattedDate },
    { label: 'Duration', value: data.durationLabel },
    { label: 'Type', value: data.callType },
    { label: 'Total', value: `<span style="color: #c9a96e;">&pound;${data.grandTotal} ${data.currency}</span>` },
  ]

  const html = vaurelEmail(`
  <h2 style="font-size: 20px; font-weight: normal; margin-bottom: 24px;">We've received your request</h2>
  <p style="line-height: 1.8; margin-bottom: 16px;">Dear ${data.clientName},</p>
  <p style="line-height: 1.8; margin-bottom: 24px;">
    Thank you for contacting ${siteConfig.name}. Your booking request has been received and
    our team will be in touch within <strong style="color: #c9a96e;">15 minutes</strong>
    via ${data.preferredContact}.
  </p>
  ${summaryBlock(fields)}
  ${refBlock(data.requestId)}`)

  return sendEmail({
    to: data.to,
    subject: `Your booking request has been received — ${siteConfig.name} London`,
    html,
  })
}

export async function sendBookingConfirmed(data: {
  to: string
  clientName: string
  modelName: string | null
  formattedDate: string
  durationLabel: string
  callType: string
  location: string | null
  grandTotal: number
  currency: string
  requestId: string
}): Promise<boolean> {
  const fields = [
    ...(data.modelName ? [{ label: 'Companion', value: data.modelName }] : []),
    { label: 'Date', value: data.formattedDate },
    { label: 'Duration', value: data.durationLabel },
    { label: 'Type', value: data.callType },
    ...(data.location ? [{ label: 'Location', value: data.location }] : []),
    { label: 'Total', value: `<span style="color: #c9a96e;">&pound;${data.grandTotal} ${data.currency}</span>` },
  ]

  const html = vaurelEmail(`
  <h2 style="font-size: 20px; font-weight: normal; margin-bottom: 24px;">Your booking is confirmed</h2>
  <p style="line-height: 1.8; margin-bottom: 16px;">Dear ${data.clientName},</p>
  <p style="line-height: 1.8; margin-bottom: 24px;">
    Your booking has been confirmed. Our companion will be with you as arranged.
    If you need to make any changes, please contact us immediately.
  </p>
  ${summaryBlock(fields)}
  ${refBlock(data.requestId)}`)

  return sendEmail({
    to: data.to,
    subject: `Your booking is confirmed — ${siteConfig.name} London`,
    html,
  })
}

export async function sendBookingCancelled(data: {
  to: string
  clientName: string
  formattedDate: string
  requestId: string
}): Promise<boolean> {
  const html = vaurelEmail(`
  <h2 style="font-size: 20px; font-weight: normal; margin-bottom: 24px;">Booking update</h2>
  <p style="line-height: 1.8; margin-bottom: 16px;">Dear ${data.clientName},</p>
  <p style="line-height: 1.8; margin-bottom: 24px;">
    We regret to inform you that your booking scheduled for <strong>${data.formattedDate}</strong>
    has been cancelled.
  </p>
  <p style="line-height: 1.8; margin-bottom: 24px;">
    If you'd like to rebook or have any questions,
    please don't hesitate to contact us.
  </p>
  <p style="line-height: 1.8;">We look forward to welcoming you again.</p>
  ${refBlock(data.requestId)}`)

  return sendEmail({
    to: data.to,
    subject: `Your ${siteConfig.name} booking has been updated`,
    html,
  })
}

export async function sendBookingReminder(data: {
  to: string
  clientName: string
  modelName: string | null
  formattedDate: string
  callType: string
  location: string | null
  requestId: string
}): Promise<boolean> {
  const fields = [
    ...(data.modelName ? [{ label: 'Companion', value: data.modelName }] : []),
    { label: 'Time', value: data.formattedDate },
    { label: 'Type', value: data.callType },
    ...(data.location ? [{ label: 'Location', value: data.location }] : []),
  ]

  const html = vaurelEmail(`
  <h2 style="font-size: 20px; font-weight: normal; margin-bottom: 24px;">Your appointment is today</h2>
  <p style="line-height: 1.8; margin-bottom: 16px;">Dear ${data.clientName},</p>
  <p style="line-height: 1.8; margin-bottom: 24px;">
    This is a friendly reminder that your appointment is scheduled for today.
  </p>
  ${summaryBlock(fields)}
  <p style="line-height: 1.8; margin-top: 24px;">
    Please ensure payment is ready on arrival.
    We accept cash, Revolut, Monzo, Starling and bank transfer.
  </p>
  <p style="line-height: 1.8; margin-top: 16px;">See you soon.</p>
  ${refBlock(data.requestId)}`)

  return sendEmail({
    to: data.to,
    subject: `Reminder: Your ${siteConfig.name} appointment is today`,
    html,
  })
}
