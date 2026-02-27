import TelegramBot from 'node-telegram-bot-api'

// DivaReceptionBot - уведомления для reception
export class DivaReceptionBot {
  private bot: TelegramBot
  private receptionChatId: string
  private tommyChatId: string

  constructor() {
    const token = process.env.DIVA_RECEPTION_BOT_TOKEN
    if (!token) throw new Error('DIVA_RECEPTION_BOT_TOKEN not set')
    
    this.bot = new TelegramBot(token, { polling: false })
    this.receptionChatId = process.env.TELEGRAM_CHAT_ID_RECEPTION || ''
    this.tommyChatId = process.env.TELEGRAM_CHAT_ID_TOMMY || ''
  }

  async notifyNewBooking(booking: {
    id: string
    clientName: string
    clientPhone: string
    modelName: string
    date: Date
    duration: number
    location: string
  }) {
    const message = `
🔔 *New Booking Alert*

*Booking ID:* ${booking.id}
*Client:* ${booking.clientName}
*Phone:* ${booking.clientPhone}
*Companion:* ${booking.modelName}
*Date:* ${booking.date.toLocaleString('en-GB')}
*Duration:* ${booking.duration} hours
*Location:* ${booking.location}

⏰ Please confirm within 30 minutes
    `.trim()

    await this.bot.sendMessage(this.receptionChatId, message, {
      parse_mode: 'Markdown',
    })

    // Set 30-minute reminder
    setTimeout(async () => {
      await this.sendReminder(booking.id)
    }, 30 * 60 * 1000) // 30 minutes
  }

  private async sendReminder(bookingId: string) {
    const message = `
⚠️ *Booking Reminder*

Booking *${bookingId}* has not been confirmed yet.
Please check and confirm immediately.
    `.trim()

    await this.bot.sendMessage(this.receptionChatId, message, {
      parse_mode: 'Markdown',
    })

    // Escalate to Tommy after another 15 minutes
    setTimeout(async () => {
      await this.escalateToManager(bookingId)
    }, 15 * 60 * 1000) // 15 minutes
  }

  private async escalateToManager(bookingId: string) {
    const message = `
🚨 *Escalation Alert*

Booking *${bookingId}* has not been confirmed by reception after 45 minutes.
Please review immediately.

@Tommy - Action Required
    `.trim()

    await this.bot.sendMessage(this.tommyChatId, message, {
      parse_mode: 'Markdown',
    })
  }

  async notifyBookingConfirmed(bookingId: string) {
    const message = `✅ Booking *${bookingId}* confirmed`
    await this.bot.sendMessage(this.receptionChatId, message, {
      parse_mode: 'Markdown',
    })
  }

  async notifyBookingCancelled(bookingId: string, reason: string) {
    const message = `❌ Booking *${bookingId}* cancelled\nReason: ${reason}`
    await this.bot.sendMessage(this.receptionChatId, message, {
      parse_mode: 'Markdown',
    })
  }
}

// KeshaZeroGapBot - интеграция с AppSheet
export class KeshaZeroGapBot {
  private bot: TelegramBot

  constructor() {
    const token = process.env.KESHA_ZEROGAP_BOT_TOKEN
    if (!token) throw new Error('KESHA_ZEROGAP_BOT_TOKEN not set')
    
    this.bot = new TelegramBot(token, { polling: false })
  }

  async sendBookingCard(modelTelegramId: string, booking: {
    id: string
    clientName: string
    date: Date
    duration: number
    location: string
    status: string
  }) {
    const message = `
📅 *New Session*

*ID:* ${booking.id}
*Client:* ${booking.clientName}
*Date:* ${booking.date.toLocaleString('en-GB')}
*Duration:* ${booking.duration}h
*Location:* ${booking.location}
*Status:* ${booking.status}
    `.trim()

    await this.bot.sendMessage(modelTelegramId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Confirm', callback_data: `confirm_${booking.id}` },
            { text: '❌ Decline', callback_data: `decline_${booking.id}` },
          ],
        ],
      },
    })
  }

  async syncWithAppSheet(bookingData: any) {
    // AppSheet API integration
    const appSheetUrl = `https://api.appsheet.com/api/v2/apps/${process.env.APPSHEET_APP_ID}/tables/Bookings/Action`
    
    try {
      const response = await fetch(appSheetUrl, {
        method: 'POST',
        headers: {
          'ApplicationAccessKey': process.env.APPSHEET_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Action: 'Add',
          Properties: {},
          Rows: [bookingData],
        }),
      })

      if (!response.ok) {
        throw new Error(`AppSheet sync failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('AppSheet sync error:', error)
      throw error
    }
  }
}

// Export singleton instances
export const divaBot = new DivaReceptionBot()
export const keshaBot = new KeshaZeroGapBot()
