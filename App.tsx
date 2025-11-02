import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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

const EVENTS_STORAGE_KEY = 'calendario.events';
const CATEGORY_STORAGE_KEY = 'calendario.categories';

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


type SerializableEvent = Omit<Event, 'date'> & { date: string };

interface SharedState {
  events: SerializableEvent[];
  categories: { [key: string]: string };
}

const encodeSharedState = (state: SharedState): string => {
  const encoder = new TextEncoder();
  const json = JSON.stringify(state);
  const bytes = encoder.encode(json);
  let binary = '';

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
};

const decodeSharedState = (value: string): SharedState | null => {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const decoder = new TextDecoder();
    const json = decoder.decode(bytes);
    const parsed = JSON.parse(json) as SharedState;

    if (
      !parsed ||
      !Array.isArray(parsed.events) ||
      !parsed.categories ||
      typeof parsed.categories !== 'object' ||
      Array.isArray(parsed.categories)
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to decode shared state from URL.', error);
    return null;
  }
};

const parseSharedStateFromUrl = (): SharedState | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const encodedState = params.get('state');

  if (!encodedState) {
    return null;
  }

  return decodeSharedState(encodedState);
};

const loadStoredEvents = (): Event[] => {
  if (typeof window === 'undefined') {
    return generateInitialEvents();
  }

  const sharedState = parseSharedStateFromUrl();

  if (sharedState) {
    const validEvents = sharedState.events.filter(event => event && typeof event.date === 'string');

    if (validEvents.length) {
      return validEvents.map(event => ({
        ...event,
        date: new Date(event.date),
      }));
    }
  }

  const storedEvents = window.localStorage.getItem(EVENTS_STORAGE_KEY);

  if (!storedEvents) {
    return generateInitialEvents();
  }

  try {
    const parsedEvents = JSON.parse(storedEvents);

    if (!Array.isArray(parsedEvents)) {
      return generateInitialEvents();
    }

    return parsedEvents.map(event => ({
      ...event,
      date: new Date(event.date),
    }));
  } catch (error) {
    console.error('Failed to parse stored events. Falling back to defaults.', error);
    return generateInitialEvents();
  }
};

const loadStoredCategories = (): { [key: string]: string } => {
  if (typeof window === 'undefined') {
    return initialCategoryMap;
  }

  const sharedState = parseSharedStateFromUrl();

  if (sharedState) {
    const entries = Object.entries(sharedState.categories).filter(
      ([key, value]) => typeof key === 'string' && typeof value === 'string',
    );

    if (entries.length) {
      return entries.reduce<{ [key: string]: string }>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
    }
  }

  const storedCategories = window.localStorage.getItem(CATEGORY_STORAGE_KEY);

  if (!storedCategories) {
    return initialCategoryMap;
  }

  try {
    const parsedCategories = JSON.parse(storedCategories);

    if (!parsedCategories || typeof parsedCategories !== 'object') {
      return initialCategoryMap;
    }

    return parsedCategories as { [key: string]: string };
  } catch (error) {
    console.error('Failed to parse stored categories. Falling back to defaults.', error);
    return initialCategoryMap;
  }
};

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>(loadStoredEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [colorMap, setColorMap] = useState<{ [key: string]: string }>(loadStoredCategories);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const lastSharedStateRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const serializableEvents = events.map(event => ({
      ...event,
      date: event.date.toISOString(),
    }));

    window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(serializableEvents));
  }, [events]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(colorMap));
  }, [colorMap]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const serializableEvents: SerializableEvent[] = events.map(event => ({
      ...event,
      date: event.date.toISOString(),
    }));

    const sharedState: SharedState = {
      events: serializableEvents,
      categories: colorMap,
    };

    const encoded = encodeSharedState(sharedState);

    if (lastSharedStateRef.current === encoded) {
      return;
    }

    lastSharedStateRef.current = encoded;

    const params = new URLSearchParams(window.location.search);
    params.set('state', encoded);

    const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
  }, [events, colorMap]);


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
