// BOOKING STATE MACHINE
// Enforces valid state transitions for bookings

export type BookingStatus = 
  | 'draft'
  | 'pending'
  | 'deposit_required'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'expired';

// Valid transitions map
const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['deposit_required', 'confirmed', 'cancelled', 'expired'],
  deposit_required: ['confirmed', 'cancelled', 'expired'],
  confirmed: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['completed', 'cancelled'],
  // Terminal states:
  completed: [],
  cancelled: [],
  no_show: [],
  expired: []
};

export class BookingStateMachine {
  /**
   * Check if transition is valid
   */
  static canTransition(from: BookingStatus, to: BookingStatus): boolean {
    return BOOKING_TRANSITIONS[from].includes(to);
  }

  /**
   * Get available transitions from current state
   */
  static getAvailableTransitions(from: BookingStatus): BookingStatus[] {
    return BOOKING_TRANSITIONS[from];
  }

  /**
   * Validate and execute transition
   */
  static async transition(
    bookingId: string,
    from: BookingStatus,
    to: BookingStatus,
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Check if transition is valid
    if (!this.canTransition(from, to)) {
      return {
        success: false,
        error: `Invalid transition: ${from} → ${to}`
      };
    }

    // Business rules
    if (to === 'confirmed') {
      // Must have either:
      // - deposit paid OR
      // - explicitly confirmed without deposit
      // This would be checked in the service layer
    }

    if (to === 'in_progress') {
      // Must be within booking time window
      // This would be checked in the service layer
    }

    // All checks passed
    return { success: true };
  }

  /**
   * Check if status is terminal (no further transitions)
   */
  static isTerminal(status: BookingStatus): boolean {
    return BOOKING_TRANSITIONS[status].length === 0;
  }

  /**
   * Get human-readable label for status
   */
  static getStatusLabel(status: BookingStatus): string {
    const labels: Record<BookingStatus, string> = {
      draft: 'Draft',
      pending: 'Pending Confirmation',
      deposit_required: 'Deposit Required',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show',
      expired: 'Expired'
    };
    return labels[status];
  }

  /**
   * Get color for status badge
   */
  static getStatusColor(status: BookingStatus): string {
    const colors: Record<BookingStatus, string> = {
      draft: 'gray',
      pending: 'yellow',
      deposit_required: 'orange',
      confirmed: 'green',
      in_progress: 'blue',
      completed: 'green',
      cancelled: 'red',
      no_show: 'red',
      expired: 'gray'
    };
    return colors[status];
  }
}

// Export for use in API routes
export default BookingStateMachine;
