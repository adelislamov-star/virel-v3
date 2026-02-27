// MIDDLEWARE для RBAC проверки

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import RBAC, { Permission } from '@/lib/rbac';

const prisma = new PrismaClient();

export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<{ authorized: boolean; user?: any; error?: string }> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return { authorized: false, error: 'Authentication required' };
  }
  
  // TODO: Verify JWT token
  const userId = 'mock-user-id';
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: { role: true }
      }
    }
  });
  
  if (!user) {
    return { authorized: false, error: 'User not found' };
  }
  
  const roleCodes = user.roles.map(ur => ur.role.code as any);
  const hasPermission = RBAC.hasPermission(roleCodes, permission);
  
  if (!hasPermission) {
    return { authorized: false, error: 'Insufficient permissions' };
  }
  
  return {
    authorized: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: roleCodes
    }
  };
}

export function maskPIIForUser(userRoles: string[], data: any): any {
  if (!RBAC.shouldMaskPII(userRoles as any)) return data;
  
  const masked = { ...data };
  if (masked.phone) masked.phone = RBAC.maskPhone(masked.phone);
  if (masked.email) masked.email = RBAC.maskEmail(masked.email);
  
  return masked;
}
