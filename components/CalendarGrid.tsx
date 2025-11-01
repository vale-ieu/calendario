import React from 'react';
import { Event, SelectedSlot } from '../types';

interface CalendarGridProps {
  weekDates: Date[];
  events: Event[];
  onSelectSlot: (slot: SelectedSlot) => void;
  onSelectEvent: (event: Event) => void;
  colorMap: { [key: string]: string };
}

const hours = Array.from({ length: 24 }, (_, i) => i);

const colorClasses: { [key: string]: { bg: string, border: string, text: string, dot: string } } = {
  blue: { bg: 'bg-blue-500/20 dark:bg-blue-500/25', border: 'border-blue-500', text: 'text-blue-800 dark:text-blue-100', dot: 'bg-blue-500' },
  green: { bg: 'bg-green-500/20 dark:bg-green-500/25', border: 'border-green-500', text: 'text-green-800 dark:text-green-100', dot: 'bg-green-500' },
  red: { bg: 'bg-red-500/20 dark:bg-red-500/25', border: 'border-red-500', text: 'text-red-800 dark:text-red-100', dot: 'bg-red-500' },
  purple: { bg: 'bg-purple-500/20 dark:bg-purple-500/25', border: 'border-purple-500', text: 'text-purple-800 dark:text-purple-100', dot: 'bg-purple-500' },
  yellow: { bg: 'bg-yellow-500/20 dark:bg-yellow-500/25', border: 'border-yellow-500', text: 'text-yellow-800 dark:text-yellow-100', dot: 'bg-yellow-500' },
  indigo: { bg: 'bg-indigo-500/20 dark:bg-indigo-500/25', border: 'border-indigo-500', text: 'text-indigo-800 dark:text-indigo-100', dot: 'bg-indigo-500' },
  pink: { bg: 'bg-pink-500/20 dark:bg-pink-500/25', border: 'border-pink-500', text: 'text-pink-800 dark:text-pink-100', dot: 'bg-pink-500' },
  orange: { bg: 'bg-orange-500/20 dark:bg-orange-500/25', border: 'border-orange-500', text: 'text-orange-800 dark:text-orange-100', dot: 'bg-orange-500' },
  teal: { bg: 'bg-teal-500/20 dark:bg-teal-500/25', border: 'border-teal-500', text: 'text-teal-800 dark:text-teal-100', dot: 'bg-teal-500' },
  cyan: { bg: 'bg-cyan-500/20 dark:bg-cyan-500/25', border: 'border-cyan-500', text: 'text-cyan-800 dark:text-cyan-100', dot: 'bg-cyan-500' },
  emerald: { bg: 'bg-emerald-500/20 dark:bg-emerald-500/25', border: 'border-emerald-500', text: 'text-emerald-800 dark:text-emerald-100', dot: 'bg-emerald-500' },
  gray: { bg: 'bg-gray-500/20 dark:bg-gray-500/25', border: 'border-gray-500', text: 'text-gray-800 dark:text-gray-100', dot: 'bg-gray-500' },
};

const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

const WEEKDAY_NAMES = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];

const timeToMinutes = (time: string) => {
    if (!time || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    if (hours === 24 && minutes === 0) return 24 * 60;
    return hours * 60 + minutes;
};


const CalendarGrid: React.FC<CalendarGridProps> = ({ weekDates, events, onSelectSlot, onSelectEvent, colorMap }) => {
  const HOUR_HEIGHT_IN_REM = 7; // h-28 = 7rem

  const getCategoryFromColor = (color: string) => {
    return Object.keys(colorMap).find(key => colorMap[key] === color) || '';
  }

  return (
    <div className="grid grid-cols-[auto,1fr] min-w-[800px]">
      {/* Time column */}
      <div className="relative w-16 border-r border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 z-[2] bg-gray-100 dark:bg-gray-900 h-[70px]">&nbsp;</div> {/* Spacer for day headers */}
        {hours.map(hour => (
          <div
            key={hour}
            className="relative h-28 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
          >
            <span className="absolute right-2 top-1 text-xs text-gray-500 dark:text-gray-400">
              {hour.toString().padStart(2, '0')}:00
            </span>
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {weekDates.map((date, dayIndex) => {
            const dayEvents = events
              .filter(e => new Date(e.date).toDateString() === date.toDateString());

            // Add layout properties to each event for the current day
            const eventsWithLayout = dayEvents.map(event => {
              const myStart = timeToMinutes(event.startTime);
              const myEnd = timeToMinutes(event.endTime);

              // Find all events that are concurrent with this one
              const concurrentEvents = dayEvents
                .filter(e => {
                  const otherStart = timeToMinutes(e.startTime);
                  const otherEnd = timeToMinutes(e.endTime);
                  return Math.max(myStart, otherStart) < Math.min(myEnd, otherEnd);
                })
                .sort((a, b) => { // A stable sort is crucial
                  const startDiff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
                  if (startDiff !== 0) return startDiff;
                  return a.id.localeCompare(b.id);
                });
              
              const numConcurrent = concurrentEvents.length || 1;
              const myIndex = concurrentEvents.findIndex(e => e.id === event.id);

              const width = 100 / numConcurrent;
              const left = myIndex * width;

              return {
                ...event,
                layout: {
                  width: `calc(${width}% - 4px)`,
                  left: `${left}%`,
                }
              };
            });


          return (
          <div key={dayIndex} className="relative border-r border-gray-200 dark:border-gray-700">
            {/* Day Header */}
            <div className="sticky top-0 z-[2] p-2 text-center bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-[70px]">
              <div className={`text-sm ${isToday(date) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                 {date.toLocaleString('it-IT', { weekday: 'short' }).toUpperCase()}
              </div>
              <div className={`text-2xl font-bold ${isToday(date) ? 'bg-indigo-600 text-white' : ''} rounded-full w-8 h-8 mx-auto flex items-center justify-center`}>
                {date.getDate()}
              </div>
            </div>
            
            {/* Time slots */}
            <div className="relative">
              {hours.map(hour => (
                <div
                  key={hour}
                  className="h-28 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  onClick={() => onSelectSlot({ date, hour })}
                />
              ))}

              {/* Events for this day */}
              {eventsWithLayout
                .map(event => {
                  const startMinutes = timeToMinutes(event.startTime);
                  const endMinutes = timeToMinutes(event.endTime);
                  const durationInMinutes = Math.max(5, endMinutes - startMinutes); // min duration 5 min

                  const top = (startMinutes / 60) * HOUR_HEIGHT_IN_REM;
                  const height = (durationInMinutes / 60) * HOUR_HEIGHT_IN_REM;
                  
                  const colorStyle = colorClasses[event.color] || colorClasses.blue;
                  const categoryName = getCategoryFromColor(event.color);

                  const completedTodos = event.todos.filter(t => t.completed).length;
                  const totalTodos = event.todos.length;

                  return (
                    <div
                      key={event.id}
                      className={`absolute mx-[2px] p-1.5 rounded-md shadow-sm cursor-pointer transition-all duration-200 ease-in-out z-[1] ${colorStyle.bg} ${colorStyle.border} ${colorStyle.text} border-l-4 overflow-hidden flex flex-col justify-between`}
                      style={{ 
                        top: `${top}rem`, 
                        height: `${height}rem`, 
                        width: event.layout.width,
                        left: event.layout.left
                      }}
                      onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                      title={event.title}
                    >
                      <div>
                        <p className="font-bold text-xs truncate">{event.title}</p>
                        <p className="text-[10px] opacity-80">{event.startTime} - {event.endTime}</p>
                        <div className="text-[10px] capitalize flex items-center gap-1 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${colorStyle.dot}`}></span>
                          {categoryName}
                        </div>
                      </div>
                       {totalTodos > 0 && (
                        <div className="text-[10px] opacity-90 mt-1 pt-1 border-t border-current border-opacity-20">
                          {completedTodos}/{totalTodos} completate
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};

export default CalendarGrid;
