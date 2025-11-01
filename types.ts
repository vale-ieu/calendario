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

export interface AssistantEventInput {
  id?: string;
  title?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  color?: string;
  category?: string;
  todos?: Partial<ToDoItem>[];
}

export interface AssistantAction {
  type: 'create' | 'update' | 'delete';
  event?: AssistantEventInput;
}
