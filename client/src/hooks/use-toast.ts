import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

let toastCount = 0;

export function useToast() {
  const [state, setState] = useState<ToastState>({
    toasts: [],
    addToast: () => {},
    removeToast: () => {},
  });

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = (++toastCount).toString();
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    setState(prevState => ({
      ...prevState,
      toasts: [...prevState.toasts, newToast],
    }));

    // Auto remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setState(prevState => ({
      ...prevState,
      toasts: prevState.toasts.filter(toast => toast.id !== id),
    }));
  }, []);

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    addToast(props);
  }, [addToast]);

  return {
    toast,
    toasts: state.toasts,
    dismiss: removeToast,
  };
}
