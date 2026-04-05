export type ExperimentType =
  | 'Immunofluorescence'
  | 'Western Blot'
  | 'qPCR'
  | 'Cell Culture'
  | 'Cloning'
  | 'Flow Cytometry'
  | 'ELISA'
  | 'Other';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyPlan {
  dayNumber: number;
  date: string; // ISO date string YYYY-MM-DD
  plannedTasks: Task[];
  actualNotes: string;
  completed: boolean;
}

export interface ExperimentMetadata {
  key: string;
  value: string;
}

export interface Experiment {
  id: string;
  title: string;
  type: ExperimentType;
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string;
  sample: string;
  metadata: ExperimentMetadata[];
  dailyPlans: DailyPlan[];
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  notes: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export const EXPERIMENT_TYPES: ExperimentType[] = [
  'Immunofluorescence',
  'Western Blot',
  'qPCR',
  'Cell Culture',
  'Cloning',
  'Flow Cytometry',
  'ELISA',
  'Other',
];

export const EXPERIMENT_COLORS: Record<ExperimentType, string> = {
  'Immunofluorescence': '#3b82f6',
  'Western Blot': '#10b981',
  'qPCR': '#8b5cf6',
  'Cell Culture': '#f59e0b',
  'Cloning': '#ef4444',
  'Flow Cytometry': '#06b6d4',
  'ELISA': '#ec4899',
  'Other': '#6b7280',
};

export const DEFAULT_METADATA: Record<ExperimentType, ExperimentMetadata[]> = {
  'Immunofluorescence': [
    { key: 'Primary Antibody', value: '' },
    { key: 'Primary Ab Dilution', value: '' },
    { key: 'Secondary Antibody', value: '' },
    { key: 'Secondary Ab Dilution', value: '' },
    { key: 'Fixation Method', value: '' },
  ],
  'Western Blot': [
    { key: 'Primary Antibody', value: '' },
    { key: 'Primary Ab Dilution', value: '' },
    { key: 'Secondary Antibody', value: '' },
    { key: 'Gel Percentage', value: '' },
    { key: 'Transfer Method', value: '' },
  ],
  'qPCR': [
    { key: 'Target Gene', value: '' },
    { key: 'Primer Forward', value: '' },
    { key: 'Primer Reverse', value: '' },
    { key: 'Annealing Temp', value: '' },
  ],
  'Cell Culture': [
    { key: 'Cell Line', value: '' },
    { key: 'Passage Number', value: '' },
    { key: 'Medium', value: '' },
  ],
  'Cloning': [
    { key: 'Vector', value: '' },
    { key: 'Insert', value: '' },
    { key: 'Restriction Enzymes', value: '' },
  ],
  'Flow Cytometry': [
    { key: 'Antibody Panel', value: '' },
    { key: 'Cell Type', value: '' },
  ],
  'ELISA': [
    { key: 'Target Antigen', value: '' },
    { key: 'Detection Antibody', value: '' },
    { key: 'Standard Curve Range', value: '' },
  ],
  'Other': [],
};
