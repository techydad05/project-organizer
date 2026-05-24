export type ProjectStatus = 'running' | 'in-progress' | 'idea' | 'deferred' | 'abandoned';

export interface Project {
  id: string;
  name: string;
  reason: string;
  notes: string;
  url?: string;
  tags: string[];
  status: ProjectStatus;
  abandonReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnConfig {
  key: ProjectStatus;
  label: string;
  color: string;
  icon: string;
  description: string;
}

export const COLUMNS: ColumnConfig[] = [
  { key: 'running', label: 'Running', color: '#40c057', icon: '🟢', description: 'Live and deployed' },
  { key: 'in-progress', label: 'In Progress', color: '#2d9cdb', icon: '🔨', description: 'Actively building' },
  { key: 'idea', label: 'Ideas', color: '#be4bdb', icon: '💡', description: 'Just a concept' },
  { key: 'deferred', label: 'Deferred', color: '#f76707', icon: '⏸', description: 'Paused for later' },
  { key: 'abandoned', label: 'Abandoned', color: '#868e96', icon: '🗑', description: 'Not doing this' },
];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  running: 'Running',
  'in-progress': 'In Progress',
  idea: 'Idea',
  deferred: 'Deferred',
  abandoned: 'Abandoned',
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  running: '#40c057',
  'in-progress': '#2d9cdb',
  idea: '#be4bdb',
  deferred: '#f76707',
  abandoned: '#868e96',
};
