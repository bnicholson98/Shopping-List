import React, { useState, useEffect } from 'react';

function App() {
  const [currentList, setCurrentList] = useState([]);
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // Load data from localStorage on mount
  useEffect(() => {
    const savedList = localStorage.getItem('shoppingList');
    const savedHistory = localStorage.getItem('shoppingHistory');
    
    if (savedList) {
      setCurrentList(JSON.parse(savedList));
    }
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save current list to localStorage
  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(currentList));
  }, [currentList]);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('shoppingHistory', JSON.stringify(history));
  }, [history]);

  const addToList = (item) => {
    if (item.trim() === '') return;
    
    // Check if item already exists in current list
    const existingInList = currentList.find(i => i.text.toLowerCase() === item.trim().toLowerCase());
    if (existingInList) return;
    
    const newItem = {
      id: Date.now(),
      text: item.trim(),
      addedAt: Date.now()
    };
    
    setCurrentList([...currentList, newItem]);
    
    // Add to history if not already there
    const existingHistoryItem = history.find(h => h.text.toLowerCase() === item.trim().toLowerCase());
    if (!existingHistoryItem) {
      const historyItem = {
        id: Date.now() + 1,
        text: item.trim(),
        lastUsed: Date.now()
      };
      setHistory([historyItem, ...history]);
    } else {
      // Update lastUsed timestamp
      setHistory(history.map(h => 
        h.text.toLowerCase() === item.trim().toLowerCase() 
          ? { ...h, lastUsed: Date.now() }
          : h
      ).sort((a, b) => b.lastUsed - a.lastUsed));
    }
    
    setInputValue('');
  };

  const removeFromList = (id) => {
    setCurrentList(currentList.filter(item => item.id !== id));
  };

  const removeFromHistory = (id) => {
    setHistory(history.filter(item => item.id !== id));
  };

  const addFromHistory = (historyItem) => {
    // Check if item already exists in current list
    const existingInList = currentList.find(i => i.text.toLowerCase() === historyItem.text.toLowerCase());
    if (existingInList) return;
    
    const newItem = {
      id: Date.now(),
      text: historyItem.text,
      addedAt: Date.now()
    };
    
    setCurrentList([...currentList, newItem]);
    
    // Update lastUsed timestamp
    setHistory(history.map(h => 
      h.id === historyItem.id 
        ? { ...h, lastUsed: Date.now() }
        : h
    ).sort((a, b) => b.lastUsed - a.lastUsed));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addToList(inputValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-center text-indigo-900 mb-8">
          Malvern Shopping List
        </h1>

        {/* Current Shopping List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">          
          {currentList.length === 0 ? (
            <p className="text-gray-400 text-center py-8">We probably need toilet paper</p>
          ) : (
            <ul className="flex flex-wrap gap-2 mb-4">
              {currentList.map((item) => (
                <li
                  key={item.id}
                  className="relative bg-indigo-50 rounded-lg px-4 py-3 pr-10 transition-all hover:bg-indigo-100 inline-flex items-center"
                >
                  <span className="text-gray-800 text-base whitespace-nowrap">{item.text}</span>
                  <button
                    onClick={() => removeFromList(item.id)}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors text-lg"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add New Item Form */}
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Add new..."
                className="w-full px-4 py-3 pr-12 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-indigo-600 hover:text-indigo-800 text-2xl font-bold"
                aria-label="Add item"
              >
                +
              </button>
            </div>
          </form>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">History</h2>
          
          {history.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No history yet</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="relative bg-gray-50 rounded-lg px-4 py-3 pr-10 cursor-pointer transition-all hover:bg-indigo-50 hover:shadow-md inline-flex items-center"
                  onClick={() => addFromHistory(item)}
                >
                  <span className="text-gray-700 text-base whitespace-nowrap">{item.text}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item.id);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors text-lg"
                    aria-label="Remove from history"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
