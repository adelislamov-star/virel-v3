// EMAIL PROVIDER (Resend)
import { Resend } from 'resend';
import { NotificationData, NotificationResult, TEMPLATES, renderTemplate } from './types';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'notifications@virel.com';

export async function sendEmail(data: NotificationData): Promise<NotificationResult> {
  if (!resend) {
    console.warn('Resend not configured, email not sent');
    return {
      success: false,
      channel: 'email',
      error: 'Resend not configured'
    };
  }
  
  if (!data.recipient.email) {
    return {
      success: false,
      channel: 'email',
      error: 'No email address provided'
    };
  }
  
  const template = TEMPLATES[data.template]?.email;
  if (!template) {
    return {
      success: false,
      channel: 'email',
      error: 'No email template found'
    };
  }
  
  try {
    const subject = renderTemplate(template.subject, data.variables);
    const html = renderTemplate(template.body, data.variables).replace(/\n/g, '<br>');
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.recipient.email,
      subject,
      html
    });
    
    return {
      success: true,
      channel: 'email',
      messageId: result.data?.id
    };
    
  } catch (error: any) {
    console.error('Email send failed:', error);
    return {
      success: false,
      channel: 'email',
      error: error.message
    };
  }
}
