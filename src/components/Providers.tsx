// src/components/Providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ErrorBoundary } from './ErrorBoundary';
import { ToastProvider } from './ui/toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}