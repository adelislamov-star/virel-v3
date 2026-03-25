// Stub RBAC — all permissions granted for now
export type RoleCode = 'OWNER' | 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
export type Permission = string;

export const RBAC = {
  hasPermission(_roles: RoleCode[], _permission: Permission): boolean {
    return true;
  },
};
