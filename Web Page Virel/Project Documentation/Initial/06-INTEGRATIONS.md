# 🔌 INTEGRATIONS GUIDE

## Документ: Внешние интеграции
**Версия:** 2.0  
**Дата:** 27 февраля 2026

---

## 📚 ОГЛАВЛЕНИЕ

1. [Telegram Bots](#telegram-bots)
2. [AppSheet Integration](#appsheet-integration)
3. [Future Integrations](#future-integrations)

---

## 1. TELEGRAM BOTS

### 🤖 DivaReceptionBot

**Purpose:** Уведомления для ресепшн стафф

**Status:** ✅ Deployed on Railway

**Features:**
- Новое бронирование → notification всем ресепшн
- Напоминания каждые 30 минут
- Эскалация к Tommy при игнорировании
- Interactive inline кнопки (Confirm/Reject)

---

#### 📝 Setup:

1. **Create bot:**
```bash
# Telegram @BotFather
/newbot
Name: DivaReceptionBot
Username: diva_reception_bot
# Save token: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

2. **Get Chat IDs:**
```bash
# Send message to bot, then:
curl https://api.telegram.org/bot{TOKEN}/getUpdates

# Extract chat_id from response
# Lukas: 123456789
# Sasha: 987654321
# Adam: 456789123
# Donald: 789123456
# Tommy: 321654987
```

3. **Environment variables:**
```bash
DIVA_RECEPTION_BOT_TOKEN="1234567890:ABC..."
TELEGRAM_CHAT_ID_LUKAS="123456789"
TELEGRAM_CHAT_ID_SASHA="987654321"
TELEGRAM_CHAT_ID_ADAM="456789123"
TELEGRAM_CHAT_ID_DONALD="789123456"
TELEGRAM_CHAT_ID_TOMMY="321654987"
```

---

#### 💻 Implementation:

**API Endpoint:** `/api/integrations/telegram/diva`

```typescript
// app/api/integrations/telegram/diva/route.ts
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.DIVA_RECEPTION_BOT_TOKEN!, {
  polling: false
});

export async function POST(request: Request) {
  const { bookingId, modelName, clientName, date, time } = await request.json();
  
  const message = `
🔔 *New Booking Alert*

📅 Date: ${date}
⏰ Time: ${time}
👤 Model: ${modelName}
🙋 Client: ${clientName}
🆔 Booking ID: #${bookingId}

Please confirm availability.
  `;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Confirm', callback_data: `confirm_${bookingId}` },
        { text: '❌ Reject', callback_data: `reject_${bookingId}` }
      ]
    ]
  };
  
  // Send to all reception staff
  const chatIds = [
    process.env.TELEGRAM_CHAT_ID_LUKAS,
    process.env.TELEGRAM_CHAT_ID_SASHA,
    process.env.TELEGRAM_CHAT_ID_ADAM,
    process.env.TELEGRAM_CHAT_ID_DONALD
  ];
  
  for (const chatId of chatIds) {
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
  
  // Create notification record
  await prisma.notification.create({
    data: {
      type: 'TELEGRAM_DIVA',
      bookingId,
      recipient: chatIds.join(','),
      payload: { modelName, clientName, date, time },
      status: 'SENT',
      sentAt: new Date()
    }
  });
  
  return Response.json({ success: true });
}
```

---

#### 🔔 Reminder System:

```typescript
// cron job (runs every 30 minutes)
async function sendReminders() {
  const pendingBookings = await prisma.booking.findMany({
    where: {
      status: 'PENDING',
      createdAt: {
        lt: new Date(Date.now() - 30 * 60 * 1000) // 30 mins ago
      }
    },
    include: { model: true }
  });
  
  for (const booking of pendingBookings) {
    // Check if already notified recently
    const recentNotification = await prisma.notification.findFirst({
      where: {
        bookingId: booking.id,
        type: 'TELEGRAM_DIVA',
        createdAt: {
          gt: new Date(Date.now() - 30 * 60 * 1000)
        }
      }
    });
    
    if (!recentNotification) {
      // Send reminder
      await fetch('/api/integrations/telegram/diva', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: booking.id,
          modelName: booking.model.name,
          clientName: booking.clientName,
          date: booking.bookingDate,
          time: booking.bookingTime
        })
      });
      
      // If 60+ minutes without response, escalate to Tommy
      const bookingAge = Date.now() - booking.createdAt.getTime();
      if (bookingAge > 60 * 60 * 1000) {
        await bot.sendMessage(
          process.env.TELEGRAM_CHAT_ID_TOMMY!,
          `⚠️ ESCALATION: Booking #${booking.id} pending for 60+ minutes!`,
          { parse_mode: 'Markdown' }
        );
      }
    }
  }
}
```

---

### 🤖 Kesha ZeroGap Bot

**Purpose:** Интеграция с AppSheet для управления букингами

**Status:** 🚧 In Development

**Features:**
- Синхронизация booking data с AppSheet
- Interactive cards для моделей
- Real-time session tracking
- Payment tracking

---

#### 📝 Setup:

1. **Create bot:**
```bash
/newbot
Name: KeshaZeroGapBot
Username: kesha_zerogap_bot
Token: 9876543210:ZYXwvuTSRqponMLKjiHGFedcBA
```

2. **Webhook:**
```bash
curl -X POST \
  https://api.telegram.org/bot{TOKEN}/setWebhook \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://virel.com/api/integrations/telegram/kesha"
  }'
```

---

#### 💻 Implementation:

**Webhook Handler:** `/api/integrations/telegram/kesha`

```typescript
export async function POST(request: Request) {
  const update = await request.json();
  
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    
    // Check if user is a model
    const model = await prisma.model.findFirst({
      where: { telegramChatId: chatId.toString() }
    });
    
    if (!model) {
      return Response.json({ error: 'Unauthorized' });
    }
    
    // Handle commands
    if (text === '/today') {
      return sendTodaysBookings(model);
    } else if (text === '/upcoming') {
      return sendUpcomingBookings(model);
    } else if (text.startsWith('/complete ')) {
      const bookingId = text.split(' ')[1];
      return markBookingComplete(bookingId, model);
    }
  }
  
  // Handle callback queries (button clicks)
  if (update.callback_query) {
    const data = update.callback_query.data;
    
    if (data.startsWith('start_')) {
      const bookingId = data.replace('start_', '');
      return handleStartSession(bookingId);
    } else if (data.startsWith('complete_')) {
      const bookingId = data.replace('complete_', '');
      return handleCompleteSession(bookingId);
    }
  }
  
  return Response.json({ ok: true });
}
```

---

#### 📊 Interactive Cards:

```typescript
async function sendTodaysBookings(model: Model) {
  const bookings = await prisma.booking.findMany({
    where: {
      modelId: model.id,
      bookingDate: {
        gte: startOfDay(new Date()),
        lte: endOfDay(new Date())
      },
      status: 'CONFIRMED'
    }
  });
  
  if (bookings.length === 0) {
    await bot.sendMessage(
      model.telegramChatId!,
      'No bookings for today.'
    );
    return;
  }
  
  for (const booking of bookings) {
    const message = `
📅 *Booking #${booking.id}*

⏰ Time: ${booking.bookingTime}
⏱ Duration: ${booking.duration} min
📍 Location: ${booking.location}
🙋 Client: ${booking.clientName}

Status: ${booking.status}
    `;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '▶️ Start Session', callback_data: `start_${booking.id}` },
          { text: '✅ Complete', callback_data: `complete_${booking.id}` }
        ]
      ]
    };
    
    await bot.sendMessage(model.telegramChatId!, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
}
```

---

## 2. APPSHEET INTEGRATION

**Purpose:** Синхронизация booking data с мобильным AppSheet приложением

**Status:** 🚧 In Development

---

### 📝 Setup:

1. **AppSheet Credentials:**
```bash
APPSHEET_API_KEY="V2-xxxxx-xxxxx-xxxxx"
APPSHEET_APP_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
APPSHEET_TABLE_NAME="Bookings"
```

2. **API Endpoint:** `https://api.appsheet.com/api/v2/apps/{APP_ID}/tables/{TABLE}/Action`

---

### 💻 Implementation:

**Sync Endpoint:** `/api/integrations/appsheet/sync`

```typescript
export async function POST(request: Request) {
  const { action, bookingId } = await request.json();
  
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { model: true }
  });
  
  if (!booking) {
    return Response.json({ error: 'Booking not found' }, { status: 404 });
  }
  
  // Prepare AppSheet payload
  const payload = {
    Action: action, // "Add" or "Edit"
    Properties: {
      Locale: "en-GB",
      Timezone: "Europe/London"
    },
    Rows: [
      {
        BookingID: booking.id,
        ModelName: booking.model.name,
        ClientName: booking.clientName,
        ClientEmail: booking.clientEmail,
        ClientPhone: booking.clientPhone,
        Date: booking.bookingDate.toISOString(),
        Time: booking.bookingTime,
        Duration: booking.duration,
        Location: booking.location,
        LocationType: booking.locationType,
        TotalAmount: booking.totalAmount,
        Status: booking.status,
        ConfirmationCode: booking.confirmationCode
      }
    ]
  };
  
  try {
    const response = await fetch(
      `https://api.appsheet.com/api/v2/apps/${process.env.APPSHEET_APP_ID}/tables/${process.env.APPSHEET_TABLE_NAME}/Action`,
      {
        method: 'POST',
        headers: {
          'ApplicationAccessKey': process.env.APPSHEET_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );
    
    const result = await response.json();
    
    // Log sync
    await prisma.appSheetSync.create({
      data: {
        entityType: 'BOOKING',
        entityId: bookingId,
        action,
        status: response.ok ? 'SUCCESS' : 'FAILED',
        payload,
        response: result
      }
    });
    
    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 🔄 Auto-Sync on Booking Changes:

```typescript
// In booking creation/update logic
async function createBooking(data: BookingData) {
  // Create booking
  const booking = await prisma.booking.create({ data });
  
  // Queue AppSheet sync
  await fetch('/api/integrations/appsheet/sync', {
    method: 'POST',
    body: JSON.stringify({
      action: 'Add',
      bookingId: booking.id
    })
  });
  
  return booking;
}

async function updateBookingStatus(id: string, status: BookingStatus) {
  // Update booking
  const booking = await prisma.booking.update({
    where: { id },
    data: { status }
  });
  
  // Queue AppSheet sync
  await fetch('/api/integrations/appsheet/sync', {
    method: 'POST',
    body: JSON.stringify({
      action: 'Edit',
      bookingId: id
    })
  });
  
  return booking;
}
```

---

## 3. FUTURE INTEGRATIONS

### 📧 Email (SendGrid/Resend)

**Use cases:**
- Booking confirmations
- Status updates
- Newsletters
- Password reset

**Implementation:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingConfirmation(booking: Booking) {
  await resend.emails.send({
    from: 'noreply@virel.com',
    to: booking.clientEmail,
    subject: `Booking Confirmed - ${booking.confirmationCode}`,
    html: `<h1>Your booking is confirmed!</h1>...`
  });
}
```

---

### 📱 SMS (Twilio)

**Use cases:**
- Booking reminders
- Status updates
- Verification codes

**Implementation:**
```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, message: string) {
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: to
  });
}
```

---

### 💳 Stripe

**Use cases:**
- Deposits
- Full payments
- Subscriptions (future)

**Implementation:**
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export async function createPaymentIntent(amount: number) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'gbp',
    metadata: { bookingId: '...' }
  });
  
  return paymentIntent.client_secret;
}
```

---

**Последнее обновление:** 27 февраля 2026  
**Active Integrations:** Telegram (DivaReceptionBot)
