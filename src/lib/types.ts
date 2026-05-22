export type ProjectStatus = 'current' | 'deferred' | 'abandoned';

export interface Project {
  id: string;
  name: string;
  reason: string;
  notes: string;
  url?: string;
  status: ProjectStatus;
  abandonReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  current: 'Active',
  deferred: 'Deferred',
  abandoned: 'Abandoned'
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  current: '#2d9cdb',
  deferred: '#f2994a',
  abandoned: '#eb5757'
};