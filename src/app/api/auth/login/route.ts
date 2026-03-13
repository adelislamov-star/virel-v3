import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import bcrypt from 'bcryptjs';
import { loginRatelimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (skipped if Upstash not configured)
    if (loginRatelimit) {
      const ip = request.headers.get('x-forwarded-for') ??
                 request.headers.get('x-real-ip') ??
                 '127.0.0.1';
      const { success, limit, remaining, reset } = await loginRatelimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts. Try again in 15 minutes.' } },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': String(remaining),
              'X-RateLimit-Reset': String(reset),
              'Retry-After': '900',
            },
          },
        );
      }
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: 'No password set' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
    }

    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name, role: user.roles?.[0]?.role?.code }
    });
    
    response.cookies.set('virel-token', user.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
