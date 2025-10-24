'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toast';
import { ErrorBoundary } from './error-boundary';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ErrorBoundary>
        {children}
        <Toaster />
      </ErrorBoundary>
    </SessionProvider>
  );
}