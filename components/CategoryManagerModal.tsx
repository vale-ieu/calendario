import React, { useState, useEffect } from 'react';

export interface CategoryDefinition {
  name: string;
  color: string;
}

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDefinition[];
  onSave: (categories: CategoryDefinition[]) => void;
  availableColors: string[];
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSave,
  availableColors,
}) => {
  const [localCategories, setLocalCategories] = useState<CategoryDefinition[]>(categories);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalCategories(categories);
      setError('');
    }
  }, [categories, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleAddCategory = () => {
    const unusedColor = availableColors.find(
      color => !localCategories.some(category => category.color === color)
    );

    setLocalCategories(prev => ([
      ...prev,
      {
        name: '',
        color: unusedColor || availableColors[0] || 'blue',
      },
    ]));
  };

  const handleChangeCategory = (index: number, field: keyof CategoryDefinition, value: string) => {
    setLocalCategories(prev => prev.map((category, i) => (
      i === index ? { ...category, [field]: field === 'name' ? value : value } : category
    )));
  };

  const handleDeleteCategory = (index: number) => {
    setLocalCategories(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const trimmedCategories = localCategories
      .map(category => ({ ...category, name: category.name.trim() }))
      .filter(category => category.name);

    if (trimmedCategories.length === 0) {
      setError('Aggiungi almeno una categoria.');
      return;
    }

    const names = new Set<string>();
    for (const category of trimmedCategories) {
      if (names.has(category.name.toLowerCase())) {
        setError('I nomi delle categorie devono essere unici.');
        return;
      }
      names.add(category.name.toLowerCase());
    }

    const colors = new Set<string>();
    for (const category of trimmedCategories) {
      if (colors.has(category.color)) {
        setError('Ogni categoria deve avere un colore diverso.');
        return;
      }
      colors.add(category.color);
    }

    setError('');
    onSave(trimmedCategories);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        onClick={event => event.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Gestisci categorie</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Chiudi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {localCategories.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nessuna categoria. Aggiungine una nuova per iniziare.
            </p>
          )}

          {localCategories.map((category, index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-${category.color}-500 border border-white shadow-inner`} aria-hidden="true" />
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Nome categoria
                  </label>
                  <input
                    type="text"
                    value={category.name}
                    onChange={event => handleChangeCategory(index, 'name', event.target.value)}
                    placeholder="Es. lavoro, studio..."
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
                <button
                  onClick={() => handleDeleteCategory(index)}
                  className="p-2 text-gray-400 hover:text-red-500"
                  aria-label="Elimina categoria"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Colore
                </label>
                <select
                  value={category.color}
                  onChange={event => handleChangeCategory(index, 'color', event.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  {availableColors.map(color => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="px-6 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/70 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            + Aggiungi categoria
          </button>
          <div className="flex gap-3">
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

export default CategoryManagerModal;
