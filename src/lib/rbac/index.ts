// Stub RBAC — all permissions granted for now
export type RoleCode =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'OPERATOR'
  | 'VIEWER'
  | 'OPS_MANAGER'
  | 'CONTENT_MANAGER'
  | 'FINANCE'
  | 'INTEGRATIONS_ADMIN'
  | 'READ_ONLY';

export type Permission = string;

export const RBAC = {
  hasPermission(_roles: RoleCode[], _permission: Permission): boolean {
    return true;
  },
  shouldMaskPII(_roles: RoleCode[]): boolean {
    return false;
  },
  maskPhone(phone: string): string {
    return phone.replace(/(\d{3})\d+(\d{2})/, '$1***$2');
  },
  maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain}`;
  },
};
