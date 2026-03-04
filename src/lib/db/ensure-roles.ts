import { prisma } from './client'
import type { RoleCode } from '@/lib/rbac'

const DEFAULT_ROLES: { code: RoleCode; name: string; description: string }[] = [
  { code: 'OWNER', name: 'Owner', description: 'Full access' },
  { code: 'OPS_MANAGER', name: 'Operations Manager', description: 'Manage operations' },
  { code: 'OPERATOR', name: 'Operator', description: 'Action Center' },
  { code: 'CONTENT_MANAGER', name: 'Content Manager', description: 'Manage content' },
  { code: 'FINANCE', name: 'Finance', description: 'Manage finances' },
  { code: 'INTEGRATIONS_ADMIN', name: 'Integrations Admin', description: 'Manage integrations' },
  { code: 'READ_ONLY', name: 'Read Only', description: 'Read-only access' },
]

/**
 * Ensure all RBAC roles exist in the database.
 * Safe to call multiple times — uses upsert.
 * Returns the count of roles created.
 */
export async function ensureRoles(): Promise<number> {
  const existing = await prisma.role.findMany({ select: { code: true } })
  const existingCodes = new Set(existing.map(r => r.code))

  const missing = DEFAULT_ROLES.filter(r => !existingCodes.has(r.code))

  if (missing.length === 0) {
    return 0
  }

  await prisma.role.createMany({
    data: missing,
    skipDuplicates: true,
  })

  console.log(`[ensure-roles] Created ${missing.length} roles: ${missing.map(r => r.code).join(', ')}`)
  return missing.length
}
