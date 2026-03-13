// AUTH UTILITIES
// Extracts actor from virel-token cookie, provides role checks

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { RBAC, RoleCode, Permission } from '@/lib/rbac';

export interface Actor {
  userId: string;
  email: string;
  name: string;
  roles: RoleCode[];
}

// ── getActorFromRequest ──────────────────────────────────────
// Reads virel-token cookie (which stores the user ID),
// loads user + roles from DB, returns Actor or null
export async function getActorFromRequest(
  request: NextRequest,
): Promise<Actor | null> {
  const token = request.cookies.get('virel-token')?.value;
  if (!token) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: token },
      include: { roles: { include: { role: true } } },
    });

    if (!user || user.status !== 'active') return null;

    const roles = user.roles.map((ur) => ur.role.code as RoleCode);

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      roles,
    };
  } catch {
    return null;
  }
}

// ── requireAuth ──────────────────────────────────────────────
// Returns Actor or a 401 JSON response
export async function requireAuth(
  request: NextRequest,
): Promise<Actor | NextResponse> {
  const actor = await getActorFromRequest(request);
  if (!actor) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 },
    );
  }
  return actor;
}

// ── requireRole ──────────────────────────────────────────────
// Returns Actor if they have at least one of the required roles,
// otherwise returns 403 JSON response
export async function requireRole(
  request: NextRequest,
  allowedRoles: RoleCode[],
): Promise<Actor | NextResponse> {
  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const actor = result;
  const hasRole = actor.roles.some((r) => allowedRoles.includes(r));
  if (!hasRole) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 },
    );
  }
  return actor;
}

// ── requirePermission ────────────────────────────────────────
// Returns Actor if they have the required permission via any role
export async function requirePermission(
  request: NextRequest,
  permission: Permission,
): Promise<Actor | NextResponse> {
  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const actor = result;
  const hasPermission = actor.roles.some((role) =>
    RBAC.hasPermission([role], permission),
  );
  if (!hasPermission) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 },
    );
  }
  return actor;
}

// ── isActor ──────────────────────────────────────────────────
// Type guard: checks if result is Actor (not a NextResponse)
export function isActor(result: Actor | NextResponse): result is Actor {
  return !(result instanceof NextResponse);
}
