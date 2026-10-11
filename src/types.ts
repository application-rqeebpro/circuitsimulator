import { CircuitElement, Wire, SimulationResult } from './engine/circuitSolver';
import { Experiment, QuizQuestion } from './data/experimentsData';

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  university: string;
  studyLevel: string;
  role: 'owner' | 'student';
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  subscription?: {
    status: 'active' | 'expired' | 'none';
    startsAt: string;
    expiresAt: string;
    planName: string;
  };
}

export interface ActivationCodeItem {
  id: string;
  code: string;
  durationDays: number;
  planName: string;
  createdAt: string;
  status: 'available' | 'used' | 'revoked';
  usedByStudentId?: string;
  usedByStudentName?: string;
  usedAt?: string;
}

export interface LabStats {
  totalUsers: number;
  totalStudents: number;
  activeStudents: number;
  suspendedStudents: number;
  pendingStudents: number;
  activeSubscriptions: number;
  totalActivationCodes: number;
  availableActivationCodes: number;
  usedActivationCodes: number;
  publishedExperiments: number;
  totalExperiments: number;
  simulationRunsCount: number;
  totalSavedCircuits: number;
  totalQuizAttempts: number;
}

export interface AuditLogItem {
  id: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface SavedCircuitItem {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description?: string;
  elements: CircuitElement[];
  wires: Wire[];
  createdAt: string;
  updatedAt: string;
}

export type { CircuitElement, Wire, SimulationResult, Experiment, QuizQuestion };
