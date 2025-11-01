import React, { useState, useEffect, useCallback } from 'react';
import { Event, SelectedSlot, ToDoItem } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<Event, 'id'> & { id?: string }) => void;
  onDelete: (eventId: string) => void;
  event: Event | null;
  selectedSlot: SelectedSlot | null;
  colorMap: { [key: string]: string };
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, event, selectedSlot, colorMap }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [color, setColor] = useState('blue');
  const [todos, setTodos] = useState<ToDoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setDate(new Date(event.date));
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      setColor(event.color);
      setTodos(event.todos || []);
    } else if (selectedSlot) {
      const startHour = selectedSlot.hour.toString().padStart(2, '0');
      const endHour = (selectedSlot.hour + 1).toString().padStart(2, '0');
      setTitle('');
      setDescription('');
      setDate(new Date(selectedSlot.date));
      setStartTime(`${startHour}:00`);
      setEndTime(`${endHour}:00`);
      setColor('blue'); // Default color for new events
      setTodos([]);
    }
    setError('');
    setNewTodoText('');
  }, [event, selectedSlot, isOpen]);

  const handleSave = useCallback(() => {
    if (!title.trim()) {
      setError('Il titolo è obbligatorio.');
      return;
    }
    if (startTime >= endTime) {
      setError("L'ora di fine deve essere successiva all'ora di inizio.");
      return;
    }
    onSave({
      id: event?.id,
      title,
      description,
      date,
      startTime,
      endTime,
      color,
      todos,
    });
  }, [title, description, date, startTime, endTime, color, todos, event, onSave]);

  const handleDelete = useCallback(() => {
    if (event) {
      onDelete(event.id);
    }
  }, [event, onDelete]);

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      const newTodo: ToDoItem = { id: Date.now().toString(), text: newTodoText, completed: false };
      setTodos([...todos, newTodo]);
      setNewTodoText('');
    }
  };

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{event ? 'Modifica Evento' : 'Crea Evento'}</h2>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Titolo</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Aggiungi un titolo"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrizione</label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Aggiungi dettagli..."
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {Object.entries(colorMap).map(([type, colorValue]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setColor(colorValue)}
                  className={`w-8 h-8 rounded-full bg-${colorValue}-500 focus:outline-none transition-transform transform hover:scale-110 ${color === colorValue ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-indigo-500' : ''}`}
                  aria-label={`Categoria ${type}`}
                />
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data</label>
            <input
              type="date"
              id="date"
              value={date.toISOString().split('T')[0]}
              onChange={e => setDate(new Date(e.target.value))}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Inizio</label>
              <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  step="300" // 5 minutes
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <div className="flex-1">
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fine</label>
              <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  step="300" // 5 minutes
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
          </div>
           <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cose da fare</label>
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                  placeholder="Nuova attività..."
                  className="flex-grow block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button onClick={handleAddTodo} className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Aggiungi
                </button>
              </div>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {todos.map((todo) => (
                  <li key={todo.id} className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                    <input type="checkbox" checked={todo.completed} onChange={() => handleToggleTodo(todo.id)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                    <span className={`flex-grow ${todo.completed ? 'line-through text-gray-500' : ''}`}>{todo.text}</span>
                    <button onClick={() => handleDeleteTodo(todo.id)} className="text-gray-400 hover:text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center mt-auto border-t border-gray-200 dark:border-gray-700">
          <div>
            {event && (
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Elimina
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
