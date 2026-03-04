// MEMBERSHIP STATE MACHINE
export type MembershipStatus = 'pending' | 'active' | 'past_due' | 'suspended' | 'cancelled' | 'expired';

const transitions: Record<MembershipStatus, MembershipStatus[]> = {
  pending: ['active', 'cancelled'],
  active: ['past_due', 'cancelled'],
  past_due: ['active', 'suspended'],
  suspended: ['active', 'cancelled'],
  cancelled: [],
  expired: []
};

const TERMINAL: MembershipStatus[] = ['cancelled', 'expired'];
const REQUIRES_REASON: MembershipStatus[] = ['cancelled', 'suspended'];

const labels: Record<MembershipStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  past_due: 'Past Due',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
  expired: 'Expired'
};

const colors: Record<MembershipStatus, string> = {
  pending: 'yellow',
  active: 'green',
  past_due: 'orange',
  suspended: 'red',
  cancelled: 'gray',
  expired: 'gray'
};

export class MembershipStateMachine {
  static canTransition(from: MembershipStatus, to: MembershipStatus): boolean {
    return transitions[from]?.includes(to) ?? false;
  }

  static getAvailableTransitions(from: MembershipStatus): MembershipStatus[] {
    return transitions[from] || [];
  }

  static isTerminal(status: MembershipStatus): boolean {
    return TERMINAL.includes(status);
  }

  static requiresReason(to: MembershipStatus): boolean {
    return REQUIRES_REASON.includes(to);
  }

  static getLabel(status: MembershipStatus): string {
    return labels[status] || status;
  }

  static getColor(status: MembershipStatus): string {
    return colors[status] || 'default';
  }

  static transition(from: MembershipStatus, to: MembershipStatus, reasonCode?: string): MembershipStatus {
    if (!this.canTransition(from, to)) {
      throw new Error(`Cannot transition membership from ${from} to ${to}`);
    }
    if (this.requiresReason(to) && !reasonCode) {
      throw new Error(`Reason required for transition to ${to}`);
    }
    return to;
  }
}
