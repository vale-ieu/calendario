export interface ToDoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
  color: string;
  todos: ToDoItem[];
}

export interface SelectedSlot {
  date: Date;
  hour: number;
}
