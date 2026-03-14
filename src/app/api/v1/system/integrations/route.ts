import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    email: {
      provider: 'Resend',
      configured: !!process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? null,
    },
    telegram: {
      botConfigured: !!process.env.TELEGRAM_DIVA_BOT_TOKEN,
      chatConfigured: !!process.env.TELEGRAM_ADMIN_CHAT_ID,
    },
    r2: {
      configured: !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY),
      bucket: process.env.R2_BUCKET_NAME ?? null,
    },
    cron: {
      secretConfigured: !!process.env.CRON_SECRET,
    },
    anthropic: {
      configured: !!process.env.ANTHROPIC_API_KEY,
    },
  });
}
