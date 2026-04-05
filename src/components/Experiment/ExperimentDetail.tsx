import { useState, useMemo } from 'react';
import { useExperimentStore } from '../../store/useExperimentStore';
import { format, parseISO, formatDateRange } from '../../utils/date';
import {
  EXPERIMENT_TYPES,
  type ExperimentType,
  type ExperimentMetadata,
} from '../../types/experiment';

export default function ExperimentDetail() {
  const {
    experiments,
    selectedExperimentId,
    selectExperiment,
    updateExperiment,
    deleteExperiment,
    updateDailyPlan,
    addTask,
    toggleTask,
    removeTask,
  } = useExperimentStore();

  const experiment = useMemo(
    () => experiments.find((e) => e.id === selectedExperimentId),
    [experiments, selectedExperimentId]
  );

  const [newTaskText, setNewTaskText] = useState<Record<number, string>>({});
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<ExperimentType>('Other');
  const [editSample, setEditSample] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editMetadata, setEditMetadata] = useState<ExperimentMetadata[]>([]);
  const [editStatus, setEditStatus] = useState<'planned' | 'in-progress' | 'completed' | 'cancelled'>('planned');

  if (!experiment) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const startEditing = () => {
    setEditTitle(experiment.title);
    setEditType(experiment.type);
    setEditSample(experiment.sample);
    setEditStartDate(experiment.startDate);
    setEditEndDate(experiment.endDate);
    setEditNotes(experiment.notes);
    setEditMetadata([...experiment.metadata]);
    setEditStatus(experiment.status);
    setIsEditing(true);
  };

  const saveEdits = () => {
    updateExperiment(experiment.id, {
      title: editTitle,
      type: editType,
      sample: editSample,
      startDate: editStartDate,
      endDate: editEndDate,
      notes: editNotes,
      metadata: editMetadata,
      status: editStatus,
    });
    setIsEditing(false);
  };

  const handleAddTask = (dayNumber: number) => {
    const text = newTaskText[dayNumber]?.trim();
    if (!text) return;
    addTask(experiment.id, dayNumber, text);
    setNewTaskText((prev) => ({ ...prev, [dayNumber]: '' }));
  };

  const startEditingDayNotes = (dayNumber: number, currentNotes: string) => {
    setEditingNotes(dayNumber);
    setTempNotes(currentNotes);
  };

  const saveDayNotes = (dayNumber: number) => {
    updateDailyPlan(experiment.id, dayNumber, { actualNotes: tempNotes });
    setEditingNotes(null);
  };

  const handleDelete = () => {
    deleteExperiment(experiment.id);
    selectExperiment(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20" onClick={() => selectExperiment(null)} />
      <div className="relative ml-auto w-full max-w-xl bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded-full" style={{ backgroundColor: experiment.color }} />
              {isEditing ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-lg font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <h2 className="text-lg font-semibold text-gray-900">{experiment.title}</h2>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdits}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startEditing}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => selectExperiment(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* General Info */}
          <section className="space-y-3">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Type</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as ExperimentType)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none bg-white"
                    >
                      {EXPERIMENT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as typeof editStatus)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none bg-white"
                    >
                      <option value="planned">Planned</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Start</label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">End</label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      min={editStartDate}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Sample</label>
                  <input
                    type="text"
                    value={editSample}
                    onChange={(e) => setEditSample(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                </div>
                {/* Metadata editing */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-500">Details</label>
                    <button
                      type="button"
                      onClick={() => setEditMetadata((p) => [...p, { key: '', value: '' }])}
                      className="text-xs text-blue-500"
                    >
                      + Add
                    </button>
                  </div>
                  {editMetadata.map((m, i) => (
                    <div key={i} className="flex gap-2 mb-1.5">
                      <input
                        value={m.key}
                        onChange={(e) =>
                          setEditMetadata((prev) =>
                            prev.map((item, idx) => (idx === i ? { ...item, key: e.target.value } : item))
                          )
                        }
                        placeholder="Field"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm outline-none"
                      />
                      <input
                        value={m.value}
                        onChange={(e) =>
                          setEditMetadata((prev) =>
                            prev.map((item, idx) => (idx === i ? { ...item, value: e.target.value } : item))
                          )
                        }
                        placeholder="Value"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm outline-none"
                      />
                      <button
                        onClick={() => setEditMetadata((p) => p.filter((_, idx) => idx !== i))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Notes</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none resize-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                    backgroundColor: experiment.color + '20',
                    color: experiment.color,
                  }}>
                    {experiment.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    experiment.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : experiment.status === 'in-progress'
                      ? 'bg-yellow-100 text-yellow-700'
                      : experiment.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {experiment.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {formatDateRange(experiment.startDate, experiment.endDate)}
                  <span className="text-gray-400"> · {experiment.dailyPlans.length} day{experiment.dailyPlans.length > 1 ? 's' : ''}</span>
                </div>
                {experiment.sample && (
                  <div className="text-sm">
                    <span className="text-gray-400">Sample:</span>{' '}
                    <span className="text-gray-700">{experiment.sample}</span>
                  </div>
                )}
                {experiment.metadata.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                    {experiment.metadata.map((m, i) => (
                      <div key={i} className="flex text-sm">
                        <span className="text-gray-400 w-36 shrink-0">{m.key}</span>
                        <span className="text-gray-700">{m.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {experiment.notes && (
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {experiment.notes}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Daily Plans */}
          {!isEditing && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Daily Plan</h3>
              <div className="space-y-3">
                {experiment.dailyPlans.map((plan) => {
                  const isCurrentDay = plan.date === todayStr;
                  const isPast = plan.date < todayStr;

                  return (
                    <div
                      key={plan.dayNumber}
                      className={`rounded-lg border p-3 ${
                        isCurrentDay
                          ? 'border-blue-300 bg-blue-50/50'
                          : isPast
                          ? 'border-gray-200 bg-gray-50/50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Day {plan.dayNumber}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(parseISO(plan.date), 'EEE, MMM d')}
                          </span>
                          {isCurrentDay && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500 text-white font-medium">
                              TODAY
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => updateDailyPlan(experiment.id, plan.dayNumber, { completed: !plan.completed })}
                          className={`text-xs px-2 py-0.5 rounded ${
                            plan.completed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {plan.completed ? 'Done' : 'Mark done'}
                        </button>
                      </div>

                      {/* Tasks */}
                      <div className="space-y-1">
                        {plan.plannedTasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-2 group">
                            <button
                              onClick={() => toggleTask(experiment.id, plan.dayNumber, task.id)}
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                task.completed
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {task.completed && (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <span className={`text-sm flex-1 ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                              {task.text}
                            </span>
                            <button
                              onClick={() => removeTask(experiment.id, plan.dayNumber, task.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add task */}
                      <div className="flex gap-1.5 mt-2">
                        <input
                          type="text"
                          value={newTaskText[plan.dayNumber] || ''}
                          onChange={(e) =>
                            setNewTaskText((prev) => ({ ...prev, [plan.dayNumber]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTask(plan.dayNumber)}
                          placeholder="Add task..."
                          className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded outline-none focus:border-blue-400"
                        />
                        <button
                          onClick={() => handleAddTask(plan.dayNumber)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                        >
                          Add
                        </button>
                      </div>

                      {/* Day notes / actual recording */}
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        {editingNotes === plan.dayNumber ? (
                          <div className="space-y-1.5">
                            <textarea
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Record what was done today..."
                              rows={3}
                              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded outline-none focus:border-blue-400 resize-none"
                              autoFocus
                            />
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => setEditingNotes(null)}
                                className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveDayNotes(plan.dayNumber)}
                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditingDayNotes(plan.dayNumber, plan.actualNotes)}
                            className="w-full text-left text-sm"
                          >
                            {plan.actualNotes ? (
                              <div className="text-gray-600 whitespace-pre-wrap">{plan.actualNotes}</div>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                {isPast || isCurrentDay ? 'Click to record notes...' : 'Notes will go here...'}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Delete */}
          {!isEditing && (
            <div className="pt-4 border-t border-gray-100">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Delete this experiment?</span>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-gray-400 hover:text-red-500"
                >
                  Delete experiment
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
