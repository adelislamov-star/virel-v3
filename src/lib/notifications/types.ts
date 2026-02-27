// NOTIFICATION TYPES & INTERFACES
export type NotificationChannel = 'email' | 'sms' | 'telegram';

export type NotificationTemplate = 
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'inquiry_received'
  | 'reminder_24h'
  | 'reminder_2h'
  | 'task_assigned'
  | 'exception_created';

export interface NotificationData {
  template: NotificationTemplate;
  recipient: {
    email?: string;
    phone?: string;
    telegramChatId?: string;
    name?: string;
  };
  variables: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
}

// Template definitions
export const TEMPLATES: Record<NotificationTemplate, {
  email?: { subject: string; body: string };
  sms?: { body: string };
  telegram?: { body: string };
}> = {
  booking_confirmed: {
    email: {
      subject: 'Booking Confirmed - {{modelName}}',
      body: `Hi {{clientName}},

Your booking with {{modelName}} has been confirmed!

Date: {{date}}
Time: {{time}}
Location: {{location}}
Duration: {{duration}}
Total: £{{amount}}

Thank you for choosing Virel.

Best regards,
Virel Team`
    },
    sms: {
      body: 'Booking confirmed with {{modelName}} on {{date}} at {{time}}. Total: £{{amount}}. Thank you!'
    },
    telegram: {
      body: `✅ *Booking Confirmed*

Model: {{modelName}}
Date: {{date}}
Time: {{time}}
Location: {{location}}
Total: £{{amount}}

Client: {{clientName}}`
    }
  },
  
  booking_cancelled: {
    email: {
      subject: 'Booking Cancelled',
      body: `Hi {{clientName}},

Your booking with {{modelName}} on {{date}} has been cancelled.

If you have any questions, please contact us.

Best regards,
Virel Team`
    },
    telegram: {
      body: `❌ *Booking Cancelled*

Model: {{modelName}}
Date: {{date}}
Client: {{clientName}}`
    }
  },
  
  payment_received: {
    email: {
      subject: 'Payment Received - £{{amount}}',
      body: `Hi {{clientName}},

We have received your payment of £{{amount}}.

Transaction ID: {{transactionId}}

Thank you!

Best regards,
Virel Team`
    },
    telegram: {
      body: `💰 *Payment Received*

Amount: £{{amount}}
Client: {{clientName}}
Booking: {{bookingId}}`
    }
  },
  
  payment_failed: {
    telegram: {
      body: `⚠️ *Payment Failed*

Amount: £{{amount}}
Client: {{clientName}}
Reason: {{reason}}

Action required!`
    }
  },
  
  inquiry_received: {
    telegram: {
      body: `📝 *New Inquiry*

From: {{clientName}}
Location: {{location}}
Date: {{date}}
Message: {{message}}`
    }
  },
  
  reminder_24h: {
    email: {
      subject: 'Reminder: Booking Tomorrow',
      body: `Hi {{clientName}},

This is a reminder that you have a booking tomorrow with {{modelName}}.

Date: {{date}}
Time: {{time}}
Location: {{location}}

See you soon!

Best regards,
Virel Team`
    },
    sms: {
      body: 'Reminder: Booking tomorrow with {{modelName}} at {{time}}. Location: {{location}}'
    }
  },
  
  reminder_2h: {
    sms: {
      body: 'Reminder: Your booking with {{modelName}} starts in 2 hours at {{time}}. Location: {{location}}'
    },
    telegram: {
      body: `⏰ *Booking in 2 Hours*

Model: {{modelName}}
Time: {{time}}
Location: {{location}}
Client: {{clientName}}`
    }
  },
  
  task_assigned: {
    telegram: {
      body: `📋 *Task Assigned*

Subject: {{subject}}
Priority: {{priority}}
Due: {{dueAt}}

/task_{{taskId}}`
    }
  },
  
  exception_created: {
    telegram: {
      body: `⚠️ *Exception Alert*

Type: {{type}}
Severity: {{severity}}
Summary: {{summary}}

Action required!`
    }
  }
};

// Template rendering
export function renderTemplate(template: string, variables: Record<string, any>): string {
  let rendered = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value || ''));
  }
  
  return rendered;
}
