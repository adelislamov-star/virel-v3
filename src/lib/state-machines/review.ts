// REVIEW STATE MACHINE
// Enforces valid state transitions for reviews

export type ReviewStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'flagged'
  | 'escalated';

const REVIEW_TRANSITIONS: Record<ReviewStatus, ReviewStatus[]> = {
  pending: ['approved', 'rejected', 'flagged'],
  flagged: ['approved', 'rejected', 'escalated'],
  approved: ['escalated'],
  escalated: ['approved', 'rejected'],
  // Terminal states:
  rejected: []
};

export class ReviewStateMachine {
  static canTransition(from: ReviewStatus, to: ReviewStatus): boolean {
    return REVIEW_TRANSITIONS[from].includes(to);
  }

  static getAvailableTransitions(from: ReviewStatus): ReviewStatus[] {
    return REVIEW_TRANSITIONS[from];
  }

  static isTerminal(status: ReviewStatus): boolean {
    return REVIEW_TRANSITIONS[status].length === 0;
  }

  static getStatusLabel(status: ReviewStatus): string {
    const labels: Record<ReviewStatus, string> = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      flagged: 'Flagged',
      escalated: 'Escalated'
    };
    return labels[status];
  }

  static getStatusColor(status: ReviewStatus): string {
    const colors: Record<ReviewStatus, string> = {
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
      flagged: 'orange',
      escalated: 'purple'
    };
    return colors[status];
  }
}

export default ReviewStateMachine;
