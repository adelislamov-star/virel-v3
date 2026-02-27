// NOTIFICATIONS API
// POST /api/v1/notifications/send

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import NotificationService from '@/lib/notifications/service';
import { NotificationChannel, NotificationTemplate } from '@/lib/notifications/types';

const SendNotificationSchema = z.object({
  template: z.string(),
  recipient: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    telegramChatId: z.string().optional(),
    name: z.string().optional()
  }),
  variables: z.record(z.any()),
  channels: z.array(z.enum(['email', 'sms', 'telegram'])).default(['email']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = SendNotificationSchema.parse(body);
    
    const results = await NotificationService.send(
      {
        template: data.template as NotificationTemplate,
        recipient: data.recipient,
        variables: data.variables,
        priority: data.priority
      },
      data.channels as NotificationChannel[]
    );
    
    const allSuccess = results.every(r => r.success);
    
    return NextResponse.json({
      success: allSuccess,
      data: { results },
      message: allSuccess 
        ? 'All notifications sent successfully'
        : 'Some notifications failed'
    }, { status: allSuccess ? 200 : 207 });
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors
        }
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}
