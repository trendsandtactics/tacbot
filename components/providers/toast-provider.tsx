// src/components/providers/toast-provider.tsx
'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Toaster
      position='top-right'
      toastOptions={{
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        },
        success: {
          duration: 3000,
          style: {
            background: '#22c55e'
          }
        },
        error: {
          duration: 3000,
          style: {
            background: '#ef4444'
          }
        },
        loading: {
          duration: Infinity,
          style: {
            background: '#363636'
          }
        }
      }}
    />
  );
}
