// TELEGRAM PROVIDER
import { NotificationData, NotificationResult, TEMPLATES, renderTemplate } from './types';

const DIVA_BOT_TOKEN = process.env.DIVA_RECEPTION_BOT_TOKEN || '';
const KESHA_BOT_TOKEN = process.env.KESHA_ZEROGAP_BOT_TOKEN || '';

export async function sendTelegram(
  data: NotificationData,
  botType: 'diva' | 'kesha' = 'kesha'
): Promise<NotificationResult> {
  const botToken = botType === 'diva' ? DIVA_BOT_TOKEN : KESHA_BOT_TOKEN;
  
  if (!botToken) {
    console.warn('Telegram bot not configured');
    return {
      success: false,
      channel: 'telegram',
      error: 'Telegram bot not configured'
    };
  }
  
  if (!data.recipient.telegramChatId) {
    return {
      success: false,
      channel: 'telegram',
      error: 'No Telegram chat ID provided'
    };
  }
  
  const template = TEMPLATES[data.template]?.telegram;
  if (!template) {
    return {
      success: false,
      channel: 'telegram',
      error: 'No Telegram template found'
    };
  }
  
  try {
    const text = renderTemplate(template.body, data.variables);
    
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: data.recipient.telegramChatId,
          text,
          parse_mode: 'Markdown'
        })
      }
    );
    
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.description || 'Telegram API error');
    }
    
    return {
      success: true,
      channel: 'telegram',
      messageId: result.result.message_id
    };
    
  } catch (error: any) {
    console.error('Telegram send failed:', error);
    return {
      success: false,
      channel: 'telegram',
      error: error.message
    };
  }
}
