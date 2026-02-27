// INQUIRY STATE MACHINE
// Enforces valid state transitions for inquiries

export type InquiryStatus = 
  | 'new'
  | 'qualified'
  | 'awaiting_client'
  | 'awaiting_deposit'
  | 'converted'
  | 'lost'
  | 'spam';

// Valid transitions map
const INQUIRY_TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
  new: ['qualified', 'spam'],
  qualified: ['awaiting_client', 'lost'],
  awaiting_client: ['awaiting_deposit', 'lost'],
  awaiting_deposit: ['converted', 'lost'],
  // Terminal states:
  converted: [],
  lost: [],
  spam: []
};

export class InquiryStateMachine {
  /**
   * Check if transition is valid
   */
  static canTransition(from: InquiryStatus, to: InquiryStatus): boolean {
    return INQUIRY_TRANSITIONS[from].includes(to);
  }

  /**
   * Get available transitions from current state
   */
  static getAvailableTransitions(from: InquiryStatus): InquiryStatus[] {
    return INQUIRY_TRANSITIONS[from];
  }

  /**
   * Validate and execute transition
   */
  static async transition(
    inquiryId: string,
    from: InquiryStatus,
    to: InquiryStatus,
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
    if (to === 'awaiting_deposit') {
      // Must have deposit amount set
      // This would be checked in the service layer
    }

    // All checks passed
    return { success: true };
  }

  /**
   * Check if status is terminal (no further transitions)
   */
  static isTerminal(status: InquiryStatus): boolean {
    return INQUIRY_TRANSITIONS[status].length === 0;
  }
}

// Export for use in API routes
export default InquiryStateMachine;
