import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface UseDebouncedSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  enabled?: boolean;
}

export function useDebouncedSearch<T>(
  query: string,
  searchFn: (query: string) => Promise<T>,
  options: UseDebouncedSearchOptions = {}
) {
  const {
    debounceMs = 300,
    minQueryLength = 3,
    enabled = true
  } = options;

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Only search if query meets minimum length and is enabled
  const shouldSearch = enabled && debouncedQuery.length >= minQueryLength;

  const queryResult = useQuery({
    queryKey: ['debounced-search', debouncedQuery],
    queryFn: () => searchFn(debouncedQuery),
    enabled: shouldSearch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    ...queryResult,
    isSearching: shouldSearch && queryResult.isLoading,
    hasSearched: shouldSearch,
  };
}

// Hook for user search specifically
export function useUserSearch(query: string, filters: Record<string, any> = {}) {
  const searchUsers = useCallback(async (searchQuery: string) => {
    const params = new URLSearchParams({
      query: searchQuery,
      ...filters,
    });

    return await apiRequest('GET', `/api/users/search?${params}`);
  }, [filters]);

  return useDebouncedSearch(query, searchUsers, {
    debounceMs: 300,
    minQueryLength: 3,
  });
}

// Hook for trending users
export function useTrendingUsers(limit = 10) {
  return useQuery({
    queryKey: ['trending-users', limit],
    queryFn: () => apiRequest('GET', `/api/users/trending?limit=${limit}`),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
