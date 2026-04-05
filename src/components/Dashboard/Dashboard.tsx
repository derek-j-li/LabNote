import { useMemo } from 'react';
import { useExperimentStore } from '../../store/useExperimentStore';
import { format, parseISO } from '../../utils/date';
import type { Experiment, DailyPlan } from '../../types/experiment';

function getDayPlanForDate(exp: Experiment, dateStr: string): DailyPlan | undefined {
  return exp.dailyPlans.find((p) => p.date === dateStr);
}

interface DayExperimentCardProps {
  experiment: Experiment;
  dayPlan: DailyPlan | undefined;
  onSelect: () => void;
}

function DayExperimentCard({ experiment, dayPlan, onSelect }: DayExperimentCardProps) {
  const totalTasks = dayPlan?.plannedTasks.length || 0;
  const completedTasks = dayPlan?.plannedTasks.filter((t) => t.completed).length || 0;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-1 h-12 rounded-full shrink-0 mt-0.5"
          style={{ backgroundColor: experiment.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{experiment.title}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
              {experiment.type}
            </span>
          </div>
          {dayPlan && (
            <p className="text-sm text-gray-500 mt-0.5">
              Day {dayPlan.dayNumber} of {experiment.dailyPlans.length}
            </p>
          )}
          {experiment.sample && (
            <p className="text-xs text-gray-400 mt-1">Sample: {experiment.sample}</p>
          )}
          {totalTasks > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(completedTasks / totalTasks) * 100}%`,
                      backgroundColor: experiment.color,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400">
                  {completedTasks}/{totalTasks}
                </span>
              </div>
            </div>
          )}
          {totalTasks > 0 && (
            <ul className="mt-2 space-y-1">
              {dayPlan!.plannedTasks.slice(0, 3).map((task) => (
                <li key={task.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                    task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                  }`}>
                    {task.completed && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className={task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>
                    {task.text}
                  </span>
                </li>
              ))}
              {totalTasks > 3 && (
                <li className="text-xs text-gray-400 pl-5">+{totalTasks - 3} more</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const { experiments, selectExperiment, setView } = useExperimentStore();

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const todayExps = useMemo(
    () => experiments.filter((e) => todayStr >= e.startDate && todayStr <= e.endDate),
    [experiments, todayStr]
  );

  const tomorrowExps = useMemo(
    () => experiments.filter((e) => tomorrowStr >= e.startDate && tomorrowStr <= e.endDate),
    [experiments, tomorrowStr]
  );

  const upcomingExps = useMemo(
    () =>
      experiments
        .filter((e) => e.startDate > tomorrowStr && e.status !== 'completed' && e.status !== 'cancelled')
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 5),
    [experiments, tomorrowStr]
  );

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Today */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Today
          </h2>
          <span className="text-sm text-gray-400">{format(new Date(), 'EEEE, MMM d')}</span>
        </div>
        {todayExps.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-gray-400">No experiments today</p>
            <button
              onClick={() => setView('calendar')}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600"
            >
              Go to calendar to plan one
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayExps.map((exp) => (
              <DayExperimentCard
                key={exp.id}
                experiment={exp}
                dayPlan={getDayPlanForDate(exp, todayStr)}
                onSelect={() => selectExperiment(exp.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Tomorrow */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900">Tomorrow</h2>
          <span className="text-sm text-gray-400">
            {format(new Date(new Date().setDate(new Date().getDate() + 1)), 'EEEE, MMM d')}
          </span>
        </div>
        {tomorrowExps.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-gray-400 text-sm">Nothing planned for tomorrow</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tomorrowExps.map((exp) => (
              <DayExperimentCard
                key={exp.id}
                experiment={exp}
                dayPlan={getDayPlanForDate(exp, tomorrowStr)}
                onSelect={() => selectExperiment(exp.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      {upcomingExps.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900">Upcoming</h2>
          </div>
          <div className="space-y-2">
            {upcomingExps.map((exp) => (
              <button
                key={exp.id}
                onClick={() => selectExperiment(exp.id)}
                className="w-full text-left bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-gray-300 transition-colors flex items-center gap-3"
              >
                <div
                  className="w-1 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: exp.color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{exp.title}</h3>
                  <p className="text-xs text-gray-400">
                    Starts {format(parseISO(exp.startDate), 'MMM d')} · {exp.dailyPlans.length} day{exp.dailyPlans.length > 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {exp.type}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
