import React from 'react';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoToToday: () => void;
  colorMap: { [key: string]: string };
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  onManageCategories: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onPrevWeek,
  onNextWeek,
  onGoToToday,
  colorMap,
  activeFilter,
  onFilterChange,
  onManageCategories
}) => {
  const monthName = currentDate.toLocaleString('it-IT', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <header className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
            Calendario
          </h1>
          <button
            onClick={onGoToToday}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Oggi
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onPrevWeek}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="Settimana precedente"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h2 className="text-lg font-semibold w-40 text-center text-gray-700 dark:text-gray-200">
            {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}
          </h2>
          <button
            onClick={onNextWeek}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="Settimana successiva"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => onFilterChange(null)}
          className={`px-3 py-1 text-xs font-medium rounded-full border ${activeFilter === null ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        >
          Mostra tutto
        </button>
        {Object.entries(colorMap).map(([type, color]) => (
          <button 
            key={type}
            onClick={() => onFilterChange(color)}
            className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full border transition-all ${activeFilter === color ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800' : 'opacity-70 hover:opacity-100'}`}
            style={{ 
              borderColor: `var(--color-${color}-500)`, 
              // A little complex to get tailwind colors programmatically, so using styles
              // In a real app, might have a better solution for dynamic classes
            }}
          >
             <span className={`w-3 h-3 rounded-full bg-${color}-500`}></span>
             <span className="capitalize">{type}</span>
          </button>
        ))}
        <button
          onClick={onManageCategories}
          className="ml-auto px-3 py-1 text-xs font-medium rounded-full border border-dashed border-indigo-400 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
        >
          Gestisci categorie
        </button>
      </div>
    </header>
  );
};

export default CalendarHeader;