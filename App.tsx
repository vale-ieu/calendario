import React, { useState, useCallback, useMemo } from 'react';
import { Event, SelectedSlot } from './types';
import CalendarHeader from './components/CalendarHeader';
import CalendarGrid from './components/CalendarGrid';
import EventModal from './components/EventModal';
import CategoryManagerModal, { CategoryDefinition } from './components/CategoryManagerModal';
import { scheduleData } from './scheduleData';


const AVAILABLE_COLORS = ['blue', 'green', 'red', 'purple', 'yellow', 'indigo', 'pink', 'orange', 'teal', 'cyan', 'emerald', 'gray'] as const;

const initialCategoryMap: { [key: string]: string } = {
  lavoro: 'blue',
  studio: 'green',
  scuola: 'red',
  allenamento: 'purple',
  pasto: 'yellow',
  spostamento: 'indigo',
  routine: 'pink',
};

const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const generateInitialEvents = () => {
  const today = new Date();
  // Set to Monday of the current week
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const startOfWeek = new Date(today.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);


  const initialEvents: Event[] = [];

  // The provided schedule is mon-sun, so we map it to the calendar days
  const scheduleDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  scheduleDays.forEach((dayKey, dayIndex) => {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + dayIndex);

    const daySchedule = scheduleData[dayKey as keyof typeof scheduleData];

    if (daySchedule) {
      daySchedule.forEach((item, itemIndex) => {
        initialEvents.push({
          id: `${dayKey}-${itemIndex}-${Date.now()}`,
          title: item.ti,
          description: item.m,
          date: new Date(currentDate),
          startTime: item.s,
          endTime: item.e,
          color: initialCategoryMap[item.t] || 'blue',
          todos: [],
        });
      });
    }
  });

  return initialEvents;
};


const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>(generateInitialEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [colorMap, setColorMap] = useState<{ [key: string]: string }>(initialCategoryMap);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);


  const handlePrevWeek = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  }, []);
  
  const handleGoToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const openModalForSlot = useCallback((slot: SelectedSlot) => {
    setSelectedSlot(slot);
    setEditingEvent(null);
    setIsModalOpen(true);
  }, []);

  const openModalForEvent = useCallback((event: Event) => {
    setEditingEvent(event);
    setSelectedSlot(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    setEditingEvent(null);
  }, []);

  const handleSaveEvent = useCallback((eventData: Omit<Event, 'id'> & { id?: string }) => {
    setEvents(prevEvents => {
      if (eventData.id && prevEvents.some(e => e.id === eventData.id)) {
        // Update existing event
        return prevEvents.map(e => e.id === eventData.id ? { ...e, ...eventData, date: new Date(eventData.date) } as Event : e);
      }
      // Add new event
      return [...prevEvents, { ...eventData, id: Date.now().toString(), date: new Date(eventData.date) } as Event];
    });
    closeModal();
  }, [closeModal]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
    closeModal();
  }, [closeModal]);

  const weekDates = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    // Start week on Monday
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [currentDate]);
  
  const filteredEvents = useMemo(() => {
    if (!activeFilter) {
      return events;
    }
    return events.filter(event => event.color === activeFilter);
  }, [events, activeFilter]);

  const categoryList = useMemo<CategoryDefinition[]>(() => (
    Object.entries(colorMap).map(([name, color]) => ({ name, color }))
  ), [colorMap]);

  const handleOpenCategoryManager = useCallback(() => {
    setIsCategoryModalOpen(true);
  }, []);

  const handleCloseCategoryManager = useCallback(() => {
    setIsCategoryModalOpen(false);
  }, []);

  const handleSaveCategories = useCallback((categories: CategoryDefinition[]) => {
    if (!categories.length) {
      return;
    }

    const nextMap = categories.reduce<{ [key: string]: string }>((acc, category) => {
      acc[category.name] = category.color;
      return acc;
    }, {});

    setColorMap(nextMap);

    const allowedColors = new Set(categories.map(category => category.color));
    const fallbackColor = categories[0]?.color ?? AVAILABLE_COLORS[0];

    setEvents(prevEvents => prevEvents.map(event => (
      allowedColors.has(event.color)
        ? event
        : { ...event, color: fallbackColor }
    )));

    if (activeFilter && !allowedColors.has(activeFilter)) {
      setActiveFilter(null);
    }
  }, [activeFilter]);

  return (
    <div className="flex flex-col h-screen font-sans">
      <CalendarHeader
        currentDate={currentDate}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onGoToToday={handleGoToToday}
        colorMap={colorMap}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onManageCategories={handleOpenCategoryManager}
      />
      <main className="flex-1 overflow-auto">
        <CalendarGrid
          weekDates={weekDates}
          events={filteredEvents}
          onSelectSlot={openModalForSlot}
          onSelectEvent={openModalForEvent}
          colorMap={colorMap}
        />
      </main>
      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          event={editingEvent}
          selectedSlot={selectedSlot}
          colorMap={colorMap}
        />
      )}
      {isCategoryModalOpen && (
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={handleCloseCategoryManager}
          categories={categoryList}
          onSave={handleSaveCategories}
          availableColors={[...AVAILABLE_COLORS]}
        />
      )}
    </div>
  );
};

export default App;
