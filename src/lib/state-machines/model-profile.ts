// MODEL PROFILE STATE MACHINE
// Enforces valid state transitions for model profiles

export type ModelProfileStatus =
  | 'draft'
  | 'active'
  | 'vacation'
  | 'archived';

const MODEL_PROFILE_TRANSITIONS: Record<ModelProfileStatus, ModelProfileStatus[]> = {
  draft: ['active'],
  active: ['vacation', 'archived'],
  vacation: ['active', 'archived'],
  archived: ['draft'],
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
      active: 'Active',
      vacation: 'Vacation',
      archived: 'Archived',
    };
    return labels[status];
  }

  static getStatusColor(status: ModelProfileStatus): string {
    const colors: Record<ModelProfileStatus, string> = {
      draft: 'gray',
      active: 'green',
      vacation: 'yellow',
      archived: 'red',
    };
    return colors[status];
  }
}

export default ModelProfileStateMachine;
