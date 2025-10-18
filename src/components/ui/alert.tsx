import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', children, ...props }, ref) => {
    const icons = {
      info: Info,
      success: CheckCircle2,
      warning: AlertCircle,
      error: XCircle,
    };

    const Icon = icons[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4',
          {
            'bg-blue-50 border-blue-200 text-blue-900': variant === 'info',
            'bg-green-50 border-green-200 text-green-900': variant === 'success',
            'bg-yellow-50 border-yellow-200 text-yellow-900': variant === 'warning',
            'bg-red-50 border-red-200 text-red-900': variant === 'error',
          },
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">{children}</div>
        </div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export default Alert;