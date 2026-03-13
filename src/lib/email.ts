import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export type EmailTemplate =
  | 'booking_confirmation'
  | 'booking_reminder'
  | 'new_lead_alert'
  | 'system_alert';

type SendEmailParams = {
  to: string;
  template: EmailTemplate;
  data: Record<string, any>;
};

export async function sendEmail({ to, template, data }: SendEmailParams): Promise<boolean> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not configured, skipping');
    return false;
  }

  const templates: Record<EmailTemplate, { subject: string; html: string }> = {
    booking_confirmation: {
      subject: `Booking Confirmed — ${data.date ?? 'TBC'}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>Booking Confirmation</h2>
          <p>Your booking has been confirmed.</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td><strong>Date</strong></td><td>${data.date ?? 'TBC'}</td></tr>
            <tr><td><strong>Duration</strong></td><td>${data.duration ?? 'TBC'}</td></tr>
            <tr><td><strong>Reference</strong></td><td>${data.reference ?? '—'}</td></tr>
          </table>
        </div>
      `,
    },
    booking_reminder: {
      subject: `Reminder: Your booking is in 2 hours`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>Booking Reminder</h2>
          <p>This is a reminder that your booking starts in 2 hours.</p>
          <p><strong>Date:</strong> ${data.date ?? 'TBC'}</p>
          <p><strong>Reference:</strong> ${data.reference ?? '—'}</p>
        </div>
      `,
    },
    new_lead_alert: {
      subject: `New Lead: ${data.name ?? 'Unknown'}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>New Lead Received</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td><strong>Name</strong></td><td>${data.name ?? '—'}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${data.phone ?? '—'}</td></tr>
            <tr><td><strong>Source</strong></td><td>${data.source ?? '—'}</td></tr>
            <tr><td><strong>Notes</strong></td><td>${data.notes ?? '—'}</td></tr>
          </table>
        </div>
      `,
    },
    system_alert: {
      subject: `[Virel Alert] ${data.title ?? 'System Alert'}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#dc2626">${data.title ?? 'System Alert'}</h2>
          <p>${data.message ?? ''}</p>
          <p style="color:#6b7280;font-size:12px">${new Date().toISOString()}</p>
        </div>
      `,
    },
  };

  try {
    const { subject, html } = templates[template];
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@virel.com',
      to,
      subject,
      html,
    });
    return true;
  } catch (error: any) {
    console.error('[email] send failed:', error.message);
    return false;
  }
}
