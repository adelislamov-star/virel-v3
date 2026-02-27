// SMS PROVIDER (Twilio)
import { Twilio } from 'twilio';
import { NotificationData, NotificationResult, TEMPLATES, renderTemplate } from './types';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const fromPhone = process.env.TWILIO_PHONE_NUMBER || '';

const twilio = accountSid && authToken 
  ? new Twilio(accountSid, authToken)
  : null;

export async function sendSMS(data: NotificationData): Promise<NotificationResult> {
  if (!twilio) {
    console.warn('Twilio not configured, SMS not sent');
    return {
      success: false,
      channel: 'sms',
      error: 'Twilio not configured'
    };
  }
  
  if (!data.recipient.phone) {
    return {
      success: false,
      channel: 'sms',
      error: 'No phone number provided'
    };
  }
  
  const template = TEMPLATES[data.template]?.sms;
  if (!template) {
    return {
      success: false,
      channel: 'sms',
      error: 'No SMS template found'
    };
  }
  
  try {
    const body = renderTemplate(template.body, data.variables);
    
    const message = await twilio.messages.create({
      from: fromPhone,
      to: data.recipient.phone,
      body
    });
    
    return {
      success: true,
      channel: 'sms',
      messageId: message.sid
    };
    
  } catch (error: any) {
    console.error('SMS send failed:', error);
    return {
      success: false,
      channel: 'sms',
      error: error.message
    };
  }
}
