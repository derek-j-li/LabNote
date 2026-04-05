import type { Experiment } from '../types/experiment';

const STORAGE_KEY = 'labnote_experiments';

export function loadExperiments(): Experiment[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveExperiments(experiments: Experiment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(experiments));
}
