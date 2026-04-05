import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Experiment, DailyPlan, Task } from '../types/experiment';
import { EXPERIMENT_COLORS, DEFAULT_METADATA } from '../types/experiment';
import { loadExperiments, saveExperiments } from '../utils/storage';
import { eachDayOfInterval, parseISO, toDateString } from '../utils/date';

interface ExperimentStore {
  experiments: Experiment[];
  selectedExperimentId: string | null;
  selectedDate: string | null;
  currentView: 'dashboard' | 'calendar';

  // Actions
  loadFromStorage: () => void;
  addExperiment: (exp: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt' | 'dailyPlans' | 'color' | 'status'>) => Experiment;
  updateExperiment: (id: string, updates: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  selectExperiment: (id: string | null) => void;
  selectDate: (date: string | null) => void;
  setView: (view: 'dashboard' | 'calendar') => void;

  // Daily plan actions
  updateDailyPlan: (experimentId: string, dayNumber: number, updates: Partial<DailyPlan>) => void;
  addTask: (experimentId: string, dayNumber: number, text: string) => void;
  toggleTask: (experimentId: string, dayNumber: number, taskId: string) => void;
  removeTask: (experimentId: string, dayNumber: number, taskId: string) => void;

  // Queries
  getExperimentsForDate: (date: string) => Experiment[];
  getTodayExperiments: () => Experiment[];
  getTomorrowExperiments: () => Experiment[];
}

function generateDailyPlans(startDate: string, endDate: string): DailyPlan[] {
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  return days.map((day, index) => ({
    dayNumber: index + 1,
    date: toDateString(day),
    plannedTasks: [],
    actualNotes: '',
    completed: false,
  }));
}

export const useExperimentStore = create<ExperimentStore>((set, get) => ({
  experiments: [],
  selectedExperimentId: null,
  selectedDate: null,
  currentView: 'dashboard',

  loadFromStorage: () => {
    const experiments = loadExperiments();
    set({ experiments });
  },

  addExperiment: (exp) => {
    const newExp: Experiment = {
      ...exp,
      id: uuidv4(),
      color: EXPERIMENT_COLORS[exp.type],
      status: 'planned',
      dailyPlans: generateDailyPlans(exp.startDate, exp.endDate),
      metadata: exp.metadata.length > 0
        ? exp.metadata
        : DEFAULT_METADATA[exp.type] || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => {
      const experiments = [...state.experiments, newExp];
      saveExperiments(experiments);
      return { experiments };
    });

    return newExp;
  },

  updateExperiment: (id, updates) => {
    set((state) => {
      const experiments = state.experiments.map((exp) => {
        if (exp.id !== id) return exp;

        const updated = { ...exp, ...updates, updatedAt: new Date().toISOString() };

        // Regenerate daily plans if dates changed
        if (
          (updates.startDate && updates.startDate !== exp.startDate) ||
          (updates.endDate && updates.endDate !== exp.endDate)
        ) {
          const newStart = updates.startDate || exp.startDate;
          const newEnd = updates.endDate || exp.endDate;
          const newPlans = generateDailyPlans(newStart, newEnd);

          // Preserve existing plan data where dates match
          updated.dailyPlans = newPlans.map((newPlan) => {
            const existing = exp.dailyPlans.find((p) => p.date === newPlan.date);
            return existing ? { ...existing, dayNumber: newPlan.dayNumber } : newPlan;
          });
        }

        // Update color if type changed
        if (updates.type) {
          updated.color = EXPERIMENT_COLORS[updates.type];
        }

        return updated;
      });
      saveExperiments(experiments);
      return { experiments };
    });
  },

  deleteExperiment: (id) => {
    set((state) => {
      const experiments = state.experiments.filter((exp) => exp.id !== id);
      saveExperiments(experiments);
      return { experiments, selectedExperimentId: state.selectedExperimentId === id ? null : state.selectedExperimentId };
    });
  },

  selectExperiment: (id) => set({ selectedExperimentId: id }),
  selectDate: (date) => set({ selectedDate: date }),
  setView: (view) => set({ currentView: view }),

  updateDailyPlan: (experimentId, dayNumber, updates) => {
    set((state) => {
      const experiments = state.experiments.map((exp) => {
        if (exp.id !== experimentId) return exp;
        return {
          ...exp,
          updatedAt: new Date().toISOString(),
          dailyPlans: exp.dailyPlans.map((plan) =>
            plan.dayNumber === dayNumber ? { ...plan, ...updates } : plan
          ),
        };
      });
      saveExperiments(experiments);
      return { experiments };
    });
  },

  addTask: (experimentId, dayNumber, text) => {
    const task: Task = { id: uuidv4(), text, completed: false };
    set((state) => {
      const experiments = state.experiments.map((exp) => {
        if (exp.id !== experimentId) return exp;
        return {
          ...exp,
          updatedAt: new Date().toISOString(),
          dailyPlans: exp.dailyPlans.map((plan) =>
            plan.dayNumber === dayNumber
              ? { ...plan, plannedTasks: [...plan.plannedTasks, task] }
              : plan
          ),
        };
      });
      saveExperiments(experiments);
      return { experiments };
    });
  },

  toggleTask: (experimentId, dayNumber, taskId) => {
    set((state) => {
      const experiments = state.experiments.map((exp) => {
        if (exp.id !== experimentId) return exp;
        return {
          ...exp,
          updatedAt: new Date().toISOString(),
          dailyPlans: exp.dailyPlans.map((plan) =>
            plan.dayNumber === dayNumber
              ? {
                  ...plan,
                  plannedTasks: plan.plannedTasks.map((t) =>
                    t.id === taskId ? { ...t, completed: !t.completed } : t
                  ),
                }
              : plan
          ),
        };
      });
      saveExperiments(experiments);
      return { experiments };
    });
  },

  removeTask: (experimentId, dayNumber, taskId) => {
    set((state) => {
      const experiments = state.experiments.map((exp) => {
        if (exp.id !== experimentId) return exp;
        return {
          ...exp,
          updatedAt: new Date().toISOString(),
          dailyPlans: exp.dailyPlans.map((plan) =>
            plan.dayNumber === dayNumber
              ? { ...plan, plannedTasks: plan.plannedTasks.filter((t) => t.id !== taskId) }
              : plan
          ),
        };
      });
      saveExperiments(experiments);
      return { experiments };
    });
  },

  getExperimentsForDate: (date) => {
    return get().experiments.filter(
      (exp) => date >= exp.startDate && date <= exp.endDate
    );
  },

  getTodayExperiments: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().getExperimentsForDate(today);
  },

  getTomorrowExperiments: () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    return get().getExperimentsForDate(tomorrowStr);
  },
}));
