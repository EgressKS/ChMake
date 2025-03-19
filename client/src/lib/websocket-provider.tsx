import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';

interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
  send: (data: any) => void;
  on: (callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const messageQueueRef = useRef<any[]>([]);
  const listenersRef = useRef<Set<(data: any) => void>>(new Set());

  useEffect(() => {
    if (!accessToken) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseReconnectDelay = 1000; // Start with 1 second

    const connect = () => {
      // Clear any existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        
        // Send authentication
        ws.send(JSON.stringify({ type: 'auth', token: accessToken }));
        
        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const msg = messageQueueRef.current.shift();
          ws.send(JSON.stringify(msg));
        }
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          listenersRef.current.forEach((callback) => callback(data));
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Only attempt to reconnect if it wasn't a manual close and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts - 1); // Exponential backoff
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached. WebSocket connection failed.');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting'); // Normal closure
        wsRef.current = null;
      }
    };
  }, [accessToken]);

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      messageQueueRef.current.push(data);
    }
  }, []);

  const on = useCallback((callback: (data: any) => void) => {
    listenersRef.current.add(callback);

    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws: wsRef.current, isConnected, send, on }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}
