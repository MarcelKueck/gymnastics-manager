import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const variantStyles = {
  default: 'bg-blue-50 text-blue-900 border-blue-200',
  success: 'bg-green-50 text-green-900 border-green-200',
  warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
  error: 'bg-red-50 text-red-900 border-red-200',
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    // Get the appropriate icon component
    const getIcon = () => {
      switch (variant) {
        case 'success':
          return CheckCircle;
        case 'warning':
          return AlertCircle;
        case 'error':
          return XCircle;
        default:
          return Info;
      }
    };

    const IconComponent = getIcon();

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <div className="flex gap-3">
          <IconComponent className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">{children}</div>
        </div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export default Alert;