// INCIDENT STATE MACHINE
// Enforces valid state transitions for incidents

export type IncidentStatus =
  | 'reported'
  | 'investigating'
  | 'resolved'
  | 'closed';

const INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  reported: ['investigating'],
  investigating: ['resolved', 'closed'],
  resolved: ['closed'],
  // Terminal states:
  closed: []
};

export class IncidentStateMachine {
  static canTransition(from: IncidentStatus, to: IncidentStatus): boolean {
    return INCIDENT_TRANSITIONS[from].includes(to);
  }

  static getAvailableTransitions(from: IncidentStatus): IncidentStatus[] {
    return INCIDENT_TRANSITIONS[from];
  }

  static isTerminal(status: IncidentStatus): boolean {
    return INCIDENT_TRANSITIONS[status].length === 0;
  }

  static getStatusLabel(status: IncidentStatus): string {
    const labels: Record<IncidentStatus, string> = {
      reported: 'Reported',
      investigating: 'Investigating',
      resolved: 'Resolved',
      closed: 'Closed'
    };
    return labels[status];
  }

  static getStatusColor(status: IncidentStatus): string {
    const colors: Record<IncidentStatus, string> = {
      reported: 'yellow',
      investigating: 'blue',
      resolved: 'green',
      closed: 'gray'
    };
    return colors[status];
  }
}

export default IncidentStateMachine;
