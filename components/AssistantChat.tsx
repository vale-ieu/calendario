import React, { useCallback, useMemo, useState } from 'react';
import { AssistantAction, Event } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantChatProps {
  events: Event[];
  colorMap: { [key: string]: string };
  onApplyActions: (actions: AssistantAction[]) => void;
  onClose: () => void;
}

const createMessageId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const ASSISTANT_RESPONSE_SCHEMA = {
  name: 'calendar_assistant_response',
  schema: {
    type: 'object',
    properties: {
      reply: { type: 'string', description: 'Conversational response to the user in Italian.' },
      actions: {
        type: 'array',
        description: 'Structured list of actions to apply to the calendar.',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['create', 'update', 'delete'],
              description: 'The action to perform on the calendar.',
            },
            event: {
              type: 'object',
              description: 'Event data to use for the action.',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                date: { type: 'string', description: 'ISO 8601 date string (YYYY-MM-DD).' },
                startTime: { type: 'string', description: 'Start time in HH:mm format.' },
                endTime: { type: 'string', description: 'End time in HH:mm format.' },
                color: { type: 'string', description: 'Direct color token to apply.' },
                category: { type: 'string', description: 'Category name that maps to a configured color.' },
                todos: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      text: { type: 'string' },
                      completed: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
          required: ['type'],
        },
      },
    },
    required: ['reply'],
    additionalProperties: false,
  },
};

const AssistantChat: React.FC<AssistantChatProps> = ({ events, colorMap, onApplyActions, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serializedEvents = useMemo(() => (
    events.map(event => ({
      id: event.id,
      title: event.title,
      date: event.date.toISOString().split('T')[0],
      startTime: event.startTime,
      endTime: event.endTime,
      category: Object.entries(colorMap).find(([, color]) => color === event.color)?.[0] ?? event.color,
    }))
  ), [events, colorMap]);

  const instructions = useMemo(() => {
    const categories = Object.entries(colorMap)
      .map(([name, color]) => `${name} (${color})`)
      .join(', ');

    return `Sei un assistente per un calendario settimanale. Quando suggerisci modifiche, rispondi SEMPRE in formato JSON conforme allo schema fornito. ` +
      `Puoi creare, aggiornare o eliminare eventi. Usa la proprietà category per riferirti ai nomi delle categorie configurate. ` +
      `Categorie disponibili: ${categories || 'nessuna definita'}. ` +
      `Assicurati di usare date nel formato YYYY-MM-DD e orari nel formato HH:mm.`;
  }, [colorMap]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    if (!apiKey.trim()) {
      setError('Inserisci una API key valida prima di inviare un messaggio.');
      return;
    }

    const newUserMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: input.trim(),
    };

    const requestMessages = [
      { role: 'system', content: instructions },
      { role: 'system', content: `Eventi attuali: ${JSON.stringify(serializedEvents)}` },
      ...messages.map(message => ({ role: message.role, content: message.content })),
      { role: 'user', content: input.trim() },
    ];

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: requestMessages,
          response_format: {
            type: 'json_schema',
            json_schema: ASSISTANT_RESPONSE_SCHEMA,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Richiesta fallita con stato ${response.status}`);
      }

      const data = await response.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Risposta del modello non valida.');
      }

      let parsed;

      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        throw new Error('Impossibile interpretare la risposta del modello.');
      }

      const reply = typeof parsed.reply === 'string' ? parsed.reply : 'Ho registrato la richiesta.';
      const actions: AssistantAction[] = Array.isArray(parsed.actions) ? parsed.actions : [];

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: reply,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (actions.length) {
        onApplyActions(actions);
      }
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof Error ? requestError.message : 'Si è verificato un errore imprevisto.');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, input, isLoading, instructions, messages, onApplyActions, serializedEvents]);

  return (
    <div className="fixed bottom-24 right-6 w-96 max-w-full rounded-lg border border-slate-300 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <h2 className="text-base font-semibold">Assistente AI</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">API Key OpenAI</span>
          <input
            type="password"
            value={apiKey}
            onChange={event => setApiKey(event.target.value)}
            placeholder="Inserisci la tua API key (non viene salvata)"
            className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring"
          />
        </label>
        <div className="h-64 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
          {messages.length === 0 ? (
            <p className="text-slate-500">Inizia la conversazione chiedendo all'assistente di programmare o modificare gli eventi.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {messages.map(message => (
                <li key={message.id} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                  <span
                    className={`inline-block max-w-full whitespace-pre-wrap rounded px-2 py-1 ${message.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800'}`}
                  >
                    {message.content}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <textarea
          value={input}
          onChange={event => setInput(event.target.value)}
          placeholder="Descrivi cosa vuoi pianificare..."
          className="h-20 rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {isLoading ? 'Invio...' : 'Invia'}
        </button>
      </div>
    </div>
  );
};

export default AssistantChat;
