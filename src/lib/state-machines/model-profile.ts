// MODEL PROFILE STATE MACHINE
// Enforces valid state transitions for model profiles

export type ModelProfileStatus =
  | 'draft'
  | 'review'
  | 'published'
  | 'hidden'
  | 'archived';

const MODEL_PROFILE_TRANSITIONS: Record<ModelProfileStatus, ModelProfileStatus[]> = {
  draft: ['review'],
  review: ['published', 'draft'],
  published: ['hidden', 'archived'],
  hidden: ['published', 'archived'],
  // Terminal states:
  archived: []
};

const REQUIRES_REASON: ModelProfileStatus[] = ['archived'];

export class ModelProfileStateMachine {
  static canTransition(from: ModelProfileStatus, to: ModelProfileStatus): boolean {
    return MODEL_PROFILE_TRANSITIONS[from].includes(to);
  }

  static getAvailableTransitions(from: ModelProfileStatus): ModelProfileStatus[] {
    return MODEL_PROFILE_TRANSITIONS[from];
  }

  static requiresReason(to: ModelProfileStatus): boolean {
    return REQUIRES_REASON.includes(to);
  }

  static isTerminal(status: ModelProfileStatus): boolean {
    return MODEL_PROFILE_TRANSITIONS[status].length === 0;
  }

  static getStatusLabel(status: ModelProfileStatus): string {
    const labels: Record<ModelProfileStatus, string> = {
      draft: 'Draft',
      review: 'Under Review',
      published: 'Published',
      hidden: 'Hidden',
      archived: 'Archived'
    };
    return labels[status];
  }

  static getStatusColor(status: ModelProfileStatus): string {
    const colors: Record<ModelProfileStatus, string> = {
      draft: 'gray',
      review: 'yellow',
      published: 'green',
      hidden: 'orange',
      archived: 'red'
    };
    return colors[status];
  }
}

export default ModelProfileStateMachine;
