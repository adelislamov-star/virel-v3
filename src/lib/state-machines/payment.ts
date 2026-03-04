// PAYMENT STATE MACHINE
// Enforces valid state transitions for payments

export type PaymentStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'disputed';

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['succeeded', 'failed', 'cancelled'],
  succeeded: ['refunded', 'disputed'],
  // Terminal states:
  failed: [],
  cancelled: [],
  refunded: [],
  disputed: []
};

export class PaymentStateMachine {
  static canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
    return PAYMENT_TRANSITIONS[from].includes(to);
  }

  static getAvailableTransitions(from: PaymentStatus): PaymentStatus[] {
    return PAYMENT_TRANSITIONS[from];
  }

  static isTerminal(status: PaymentStatus): boolean {
    return PAYMENT_TRANSITIONS[status].length === 0;
  }

  static getStatusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      pending: 'Pending',
      succeeded: 'Succeeded',
      failed: 'Failed',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
      disputed: 'Disputed'
    };
    return labels[status];
  }

  static getStatusColor(status: PaymentStatus): string {
    const colors: Record<PaymentStatus, string> = {
      pending: 'yellow',
      succeeded: 'green',
      failed: 'red',
      cancelled: 'gray',
      refunded: 'orange',
      disputed: 'purple'
    };
    return colors[status];
  }
}

export default PaymentStateMachine;
