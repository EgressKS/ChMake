import { useState, useEffect } from 'react';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount?: number;
}

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, [history]);

  const addToHistory = (query: string, resultCount?: number) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
      resultCount,
    };

    setHistory(prev => {
      // Remove existing entry with same query
      const filtered = prev.filter(item => item.query !== query);

      // Add new item at the beginning
      const updated = [newItem, ...filtered];

      // Keep only the most recent items
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const removeFromHistory = (query: string) => {
    setHistory(prev => prev.filter(item => item.query !== query));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const getRecentSearches = (limit = 5) => {
    return history.slice(0, limit);
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getRecentSearches,
  };
}
