import { useState, useCallback, useRef, useMemo } from 'react';
import { useExperimentStore } from '../../store/useExperimentStore';
import {
  getCalendarDays,
  format,
  isSameMonth,
  isToday,
  toDateString,
} from '../../utils/date';
import type { Experiment } from '../../types/experiment';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarProps {
  onCreateExperiment: (startDate: string, endDate: string) => void;
}

// Layout experiments into rows to avoid visual overlap
function layoutExperiments(experiments: Experiment[], weekDates: string[]): (Experiment | null)[][] {
  const rows: (Experiment | null)[][] = [];
  const placed = new Set<string>();

  // Sort experiments: longer ones first for better layout
  const sorted = [...experiments].sort((a, b) => {
    const aDays = weekDates.filter((d) => d >= a.startDate && d <= a.endDate).length;
    const bDays = weekDates.filter((d) => d >= b.startDate && d <= b.endDate).length;
    return bDays - aDays || a.startDate.localeCompare(b.startDate);
  });

  for (const exp of sorted) {
    if (placed.has(exp.id)) continue;

    let placedInRow = false;
    for (const row of rows) {
      const canPlace = weekDates.every((d, i) => {
        if (d >= exp.startDate && d <= exp.endDate) {
          return row[i] === null;
        }
        return true;
      });

      if (canPlace) {
        weekDates.forEach((d, i) => {
          if (d >= exp.startDate && d <= exp.endDate) {
            row[i] = exp;
          }
        });
        placed.add(exp.id);
        placedInRow = true;
        break;
      }
    }

    if (!placedInRow) {
      const newRow: (Experiment | null)[] = weekDates.map(() => null);
      weekDates.forEach((d, i) => {
        if (d >= exp.startDate && d <= exp.endDate) {
          newRow[i] = exp;
        }
      });
      rows.push(newRow);
      placed.add(exp.id);
    }
  }

  return rows;
}

export default function Calendar({ onCreateExperiment }: CalendarProps) {
  const { experiments, selectExperiment } = useExperimentStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const isDragging = useRef(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));
  const goToday = () => setCurrentDate(new Date());

  const weeks = useMemo(() => {
    const w: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      w.push(days.slice(i, i + 7));
    }
    return w;
  }, [days]);

  const handleMouseDown = useCallback((dateStr: string) => {
    isDragging.current = true;
    setDragStart(dateStr);
    setDragEnd(dateStr);
  }, []);

  const handleMouseEnter = useCallback((dateStr: string) => {
    if (isDragging.current) {
      setDragEnd(dateStr);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDragging.current && dragStart && dragEnd) {
      isDragging.current = false;
      const start = dragStart < dragEnd ? dragStart : dragEnd;
      const end = dragStart < dragEnd ? dragEnd : dragStart;
      onCreateExperiment(start, end);
      setDragStart(null);
      setDragEnd(null);
    }
  }, [dragStart, dragEnd, onCreateExperiment]);

  const isInDragRange = useCallback(
    (dateStr: string) => {
      if (!dragStart || !dragEnd) return false;
      const start = dragStart < dragEnd ? dragStart : dragEnd;
      const end = dragStart < dragEnd ? dragEnd : dragStart;
      return dateStr >= start && dateStr <= end;
    },
    [dragStart, dragEnd]
  );

  return (
    <div className="max-w-5xl mx-auto p-4" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, weekIdx) => {
          const weekDates = week.map((d) => toDateString(d));

          // Find experiments that span this week
          const weekExps = experiments.filter((exp) =>
            weekDates.some((d) => d >= exp.startDate && d <= exp.endDate)
          );

          const rows = layoutExperiments(weekExps, weekDates);

          return (
            <div key={weekIdx} className="border-b border-gray-100 last:border-b-0">
              {/* Day numbers */}
              <div className="grid grid-cols-7">
                {week.map((day) => {
                  const dateStr = toDateString(day);
                  const inMonth = isSameMonth(day, currentDate);
                  const today = isToday(day);
                  const inDrag = isInDragRange(dateStr);

                  return (
                    <div
                      key={dateStr}
                      className={`calendar-day border-r border-gray-100 last:border-r-0 px-2 pt-1.5 pb-0.5 min-h-[2rem] cursor-crosshair ${
                        inDrag ? 'drag-selecting' : ''
                      } ${!inMonth ? 'opacity-40' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleMouseDown(dateStr);
                      }}
                      onMouseEnter={() => handleMouseEnter(dateStr)}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                          today
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-gray-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Experiment bars */}
              <div className="px-0 pb-1">
                {rows.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-7 mt-0.5">
                    {row.map((exp, dayIdx) => {
                      if (!exp) {
                        return <div key={dayIdx} className="h-5" />;
                      }

                      // Check if this is the first cell of this experiment in the row
                      const isStart = dayIdx === 0 || row[dayIdx - 1]?.id !== exp.id;
                      if (!isStart) return null;

                      // Count span
                      let span = 1;
                      for (let i = dayIdx + 1; i < 7; i++) {
                        if (row[i]?.id === exp.id) span++;
                        else break;
                      }

                      const isExpStart = weekDates[dayIdx] === exp.startDate;
                      const lastIdx = dayIdx + span - 1;
                      const isExpEnd = weekDates[lastIdx] === exp.endDate;

                      return (
                        <div
                          key={dayIdx}
                          className="h-5 px-0.5"
                          style={{ gridColumn: `${dayIdx + 1} / span ${span}` }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectExperiment(exp.id);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className={`w-full h-full text-white text-[10px] font-medium px-1.5 truncate text-left hover:brightness-110 transition-all ${
                              isExpStart && isExpEnd
                                ? 'rounded'
                                : isExpStart
                                ? 'rounded-l'
                                : isExpEnd
                                ? 'rounded-r'
                                : ''
                            }`}
                            style={{ backgroundColor: exp.color }}
                            title={exp.title}
                          >
                            {isExpStart ? exp.title : ''}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">
        Click and drag across days to create an experiment
      </p>
    </div>
  );
}
