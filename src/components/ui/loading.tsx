// src/components/ui/loading.tsx
import { Loader2 } from 'lucide-react';

// Spinner component
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-gray-400`} />
  );
}

// Full page loading
export function PageLoader() {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <Spinner size="lg" />
    </div>
  );
}

// Skeleton loader for text
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{ width: i === lines - 1 ? '80%' : '100%' }}
        />
      ))}
    </div>
  );
}

// Skeleton loader for cards
export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-lg p-6 animate-pulse"
        >
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <SkeletonText lines={3} />
          <div className="mt-4 h-10 bg-gray-200 rounded w-1/4" />
        </div>
      ))}
    </>
  );
}

// Skeleton loader for table rows
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4 animate-pulse" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div key={colIndex} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton loader for stats/dashboard cards
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}