
export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Incident {
  id: string;
  timestamp: number;
  type: string;
  description: string;
  severity: IncidentSeverity;
  capturedFrame?: string;
}

export interface SessionStats {
  duration: number;
  incidentCount: number;
  integrityScore: number;
  status: 'active' | 'paused' | 'idle' | 'ended';
}

export interface ProctorConfig {
  studentName: string;
  examTitle: string;
  sensitivity: number;
}
