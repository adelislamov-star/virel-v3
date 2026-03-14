// Telegram notification helper
// Sends messages via Telegram Bot API if configured

// ── Base sender ─────────────────────────────────────────────────────────
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: 'Markdown' | 'HTML' = 'Markdown',
): Promise<boolean> {
  const token = process.env.TELEGRAM_DIVA_BOT_TOKEN
  if (!token) {
    console.log('[TELEGRAM] Bot token not configured — would send to:', chatId)
    console.log('[TELEGRAM] Message preview:', text.slice(0, 100))
    return false
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error('[TELEGRAM] API error:', err)
      return false
    }
    return true
  } catch (err) {
    console.error('[TELEGRAM] Failed:', err)
    return false
  }
}

// ── Specialized senders ─────────────────────────────────────────────────
export async function notifyReception(text: string): Promise<boolean> {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) {
    console.log('[TELEGRAM] TELEGRAM_ADMIN_CHAT_ID not set — reception notify skipped')
    return false
  }
  return sendTelegramMessage(chatId, text)
}

export async function notifyTommy(text: string): Promise<boolean> {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) {
    console.log('[TELEGRAM] Tommy notify skipped — no chat_id configured')
    return false
  }
  return sendTelegramMessage(chatId, `\u{1F6A8} *ALERT*\n\n${text}`)
}
