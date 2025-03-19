import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      queryFn: async ({ queryKey }) => {
        const [url] = queryKey as [string];
        return await apiRequest('GET', url);
      },
    },
    mutations: {
      retry: false,
    },
  },
});

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${endpoint}`;

  // Get token from localStorage
  const token = localStorage.getItem('accessToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: ApiError = {
        message: errorData.message || `HTTP error! status: ${response.status}`,
        status: response.status,
        code: errorData.code,
      };
      throw error;
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return {} as T;
    }
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }

    // Network or other errors
    const apiError: ApiError = {
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    };
    throw apiError;
  }
}
