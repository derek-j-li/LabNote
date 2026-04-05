import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Experiment, DailyPlan, Task } from '../types/experiment';
import { EXPERIMENT_COLORS, DEFAULT_METADATA } from '../types/experiment';
import { eachDayOfInterval, parseISO, toDateString } from '../utils/date';
import { fetchExperiments, saveExperiment, removeExperiment } from '../utils/firestore';

interface ExperimentStore {
  experiments: Experiment[];
  selectedExperimentId: string | null;
  selectedDate: string | null;
  currentView: 'dashboard' | 'calendar';
  userId: string | null;
  loading: boolean;

  // Actions
  loadUserExperiments: (userId: string) => Promise<void>;
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

// Fire-and-forget save to Firestore (updates UI immediately, syncs in background)
function syncToCloud(userId: string | null, experiment: Experiment) {
  if (userId) {
    saveExperiment(userId, experiment).catch((err) =>
      console.error('Failed to sync experiment:', err)
    );
  }
}

export const useExperimentStore = create<ExperimentStore>((set, get) => ({
  experiments: [],
  selectedExperimentId: null,
  selectedDate: null,
  currentView: 'dashboard',
  userId: null,
  loading: false,

  loadUserExperiments: async (userId: string) => {
    set({ userId, loading: true });
    try {
      const experiments = await fetchExperiments(userId);
      set({ experiments, loading: false });
    } catch (err) {
      console.error('Failed to load experiments:', err);
      set({ experiments: [], loading: false });
    }
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
      syncToCloud(state.userId, newExp);
      return { experiments: [...state.experiments, newExp] };
    });

    return newExp;
  },

  updateExperiment: (id, updates) => {
    set((state) => {
      const experiments = state.experiments.map((exp) => {
        if (exp.id !== id) return exp;

        const updated = { ...exp, ...updates, updatedAt: new Date().toISOString() };

        if (
          (updates.startDate && updates.startDate !== exp.startDate) ||
          (updates.endDate && updates.endDate !== exp.endDate)
        ) {
          const newStart = updates.startDate || exp.startDate;
          const newEnd = updates.endDate || exp.endDate;
          const newPlans = generateDailyPlans(newStart, newEnd);

          updated.dailyPlans = newPlans.map((newPlan) => {
            const existing = exp.dailyPlans.find((p) => p.date === newPlan.date);
            return existing ? { ...existing, dayNumber: newPlan.dayNumber } : newPlan;
          });
        }

        if (updates.type) {
          updated.color = EXPERIMENT_COLORS[updates.type];
        }

        syncToCloud(state.userId, updated);
        return updated;
      });
      return { experiments };
    });
  },

  deleteExperiment: (id) => {
    set((state) => {
      if (state.userId) {
        removeExperiment(state.userId, id).catch((err) =>
          console.error('Failed to delete experiment:', err)
        );
      }
      return {
        experiments: state.experiments.filter((exp) => exp.id !== id),
        selectedExperimentId: state.selectedExperimentId === id ? null : state.selectedExperimentId,
      };
    });
  },

  selectExperiment: (id) => set({ selectedExperimentId: id }),
  selectDate: (date) => set({ selectedDate: date }),
  setView: (view) => set({ currentView: view }),

  updateDailyPlan: (experimentId, dayNumber, updates) => {
    set((state) => {
      const experiments = state.experiments.map((exp) => {
        if (exp.id !== experimentId) return exp;
        const updated = {
          ...exp,
          updatedAt: new Date().toISOString(),
          dailyPlans: exp.dailyPlans.map((plan) =>
            plan.dayNumber === dayNumber ? { ...plan, ...updates } : plan
          ),
        };
        syncToCloud(state.userId, updated);
        return updated;
      });
      return { experiments };
    });
  },

  addTask: (experimentId, dayNumber, text) => {
    const task: Task = { id: uuidv4(), text, completed: false };
    set((state) => {
      const experiments = state.experiments.map((exp) => {
        if (exp.id !== experimentId) return exp;
        const updated = {
          ...exp,
          updatedAt: new Date().toISOString(),
          dailyPlans: exp.dailyPlans.map((plan) =>
            plan.dayNumber === dayNumber
              ? { ...plan, plannedTasks: [...plan.plannedTasks, task] }
              : plan
          ),
        };
        syncToCloud(state.userId, updated);
        return updated;
      });
      return { experiments };
    });
  },

  toggleTask: (experimentId, dayNumber, taskId) => {
    set((state) => {
      const experiments = state.experiments.map((exp) => {
        if (exp.id !== experimentId) return exp;
        const updated = {
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
        syncToCloud(state.userId, updated);
        return updated;
      });
      return { experiments };
    });
  },

  removeTask: (experimentId, dayNumber, taskId) => {
    set((state) => {
      const experiments = state.experiments.map((exp) => {
        if (exp.id !== experimentId) return exp;
        const updated = {
          ...exp,
          updatedAt: new Date().toISOString(),
          dailyPlans: exp.dailyPlans.map((plan) =>
            plan.dayNumber === dayNumber
              ? { ...plan, plannedTasks: plan.plannedTasks.filter((t) => t.id !== taskId) }
              : plan
          ),
        };
        syncToCloud(state.userId, updated);
        return updated;
      });
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
