// RBAC - Role Based Access Control
// Defines permissions and policies

export type RoleCode = 
  | 'OWNER'
  | 'OPS_MANAGER'
  | 'OPERATOR'
  | 'CONTENT_MANAGER'
  | 'FINANCE'
  | 'INTEGRATIONS_ADMIN'
  | 'READ_ONLY';

export type Permission = 
  // Models
  | 'models.read'
  | 'models.create'
  | 'models.update'
  | 'models.delete'
  | 'models.publish'
  // Bookings
  | 'bookings.read'
  | 'bookings.create'
  | 'bookings.update'
  | 'bookings.delete'
  | 'bookings.confirm'
  // Inquiries
  | 'inquiries.read'
  | 'inquiries.create'
  | 'inquiries.update'
  | 'inquiries.assign'
  | 'inquiries.convert'
  // Tasks
  | 'tasks.read'
  | 'tasks.create'
  | 'tasks.update'
  | 'tasks.assign'
  | 'tasks.complete'
  // Exceptions
  | 'exceptions.read'
  | 'exceptions.resolve'
  // Payments
  | 'payments.read'
  | 'payments.create'
  | 'payments.refund'
  // Users
  | 'users.read'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  // Settings
  | 'settings.read'
  | 'settings.update'
  // Automation
  | 'automation.read'
  | 'automation.create'
  | 'automation.update'
  // Audit
  | 'audit.read'
  // Integrations
  | 'integrations.read'
  | 'integrations.update';

// Role -> Permissions mapping
export const ROLE_PERMISSIONS: Record<RoleCode, Permission[]> = {
  OWNER: [
    // Full access to everything
    'models.read', 'models.create', 'models.update', 'models.delete', 'models.publish',
    'bookings.read', 'bookings.create', 'bookings.update', 'bookings.delete', 'bookings.confirm',
    'inquiries.read', 'inquiries.create', 'inquiries.update', 'inquiries.assign', 'inquiries.convert',
    'tasks.read', 'tasks.create', 'tasks.update', 'tasks.assign', 'tasks.complete',
    'exceptions.read', 'exceptions.resolve',
    'payments.read', 'payments.create', 'payments.refund',
    'users.read', 'users.create', 'users.update', 'users.delete',
    'settings.read', 'settings.update',
    'automation.read', 'automation.create', 'automation.update',
    'audit.read',
    'integrations.read', 'integrations.update'
  ],

  OPS_MANAGER: [
    // Operations + Read-only finance
    'models.read', 'models.create', 'models.update', 'models.publish',
    'bookings.read', 'bookings.create', 'bookings.update', 'bookings.confirm',
    'inquiries.read', 'inquiries.create', 'inquiries.update', 'inquiries.assign', 'inquiries.convert',
    'tasks.read', 'tasks.create', 'tasks.update', 'tasks.assign', 'tasks.complete',
    'exceptions.read', 'exceptions.resolve',
    'payments.read', // Read-only
    'users.read', 'users.update', // Can manage operators
    'settings.read',
    'automation.read', 'automation.create', 'automation.update',
    'audit.read'
  ],

  OPERATOR: [
    // Action Center + Assigned entities
    'models.read',
    'bookings.read', 'bookings.update', 'bookings.confirm',
    'inquiries.read', 'inquiries.update',
    'tasks.read', 'tasks.update', 'tasks.complete',
    'exceptions.read', 'exceptions.resolve'
  ],

  CONTENT_MANAGER: [
    // Content only
    'models.read', 'models.create', 'models.update', 'models.publish',
    'settings.read' // SEO settings
  ],

  FINANCE: [
    // Finance only
    'payments.read', 'payments.create', 'payments.refund',
    'bookings.read', // To see payment context
    'audit.read' // Payment audit
  ],

  INTEGRATIONS_ADMIN: [
    // Integrations only
    'integrations.read', 'integrations.update',
    'audit.read' // Integration logs
  ],

  READ_ONLY: [
    // Read everything except PII
    'models.read',
    'bookings.read',
    'inquiries.read',
    'tasks.read',
    'exceptions.read',
    'users.read',
    'settings.read',
    'automation.read',
    'audit.read'
  ]
};

export class RBAC {
  /**
   * Check if user has permission
   */
  static hasPermission(userRoles: RoleCode[], permission: Permission): boolean {
    return userRoles.some(role => 
      ROLE_PERMISSIONS[role].includes(permission)
    );
  }

  /**
   * Check if user has any of the permissions
   */
  static hasAnyPermission(userRoles: RoleCode[], permissions: Permission[]): boolean {
    return permissions.some(permission => 
      this.hasPermission(userRoles, permission)
    );
  }

  /**
   * Check if user has all permissions
   */
  static hasAllPermissions(userRoles: RoleCode[], permissions: Permission[]): boolean {
    return permissions.every(permission => 
      this.hasPermission(userRoles, permission)
    );
  }

  /**
   * Get all permissions for user
   */
  static getUserPermissions(userRoles: RoleCode[]): Permission[] {
    const permissions = new Set<Permission>();
    userRoles.forEach(role => {
      ROLE_PERMISSIONS[role].forEach(permission => {
        permissions.add(permission);
      });
    });
    return Array.from(permissions);
  }

  /**
   * Check entity-level access
   */
  static canAccessEntity(
    userRoles: RoleCode[],
    userId: string,
    entity: { assignedTo?: string | null }
  ): boolean {
    // Owner and Ops Manager can access everything
    if (userRoles.includes('OWNER') || userRoles.includes('OPS_MANAGER')) {
      return true;
    }

    // Operator can only access assigned or unassigned
    if (userRoles.includes('OPERATOR')) {
      return entity.assignedTo === userId || entity.assignedTo === null;
    }

    // Default: no access
    return false;
  }

  /**
   * Should mask PII (phone, email) for this user?
   */
  static shouldMaskPII(userRoles: RoleCode[]): boolean {
    // Operator and Read-only see masked PII
    return userRoles.includes('OPERATOR') || userRoles.includes('READ_ONLY');
  }

  /**
   * Mask phone number
   */
  static maskPhone(phone: string): string {
    // +447700900123 → +447***900123
    return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
  }

  /**
   * Mask email
   */
  static maskEmail(email: string): string {
    // john@example.com → jo***@example.com
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  }
}

export default RBAC;
