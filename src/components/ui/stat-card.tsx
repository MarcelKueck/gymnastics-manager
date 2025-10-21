import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'red';
  subtitle?: string;
}

const colorClasses = {
  blue: {
    gradient: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    icon: 'bg-blue-500',
    text: 'text-blue-700',
  },
  green: {
    gradient: 'from-green-50 to-green-100',
    border: 'border-green-200',
    icon: 'bg-green-500',
    text: 'text-green-700',
  },
  purple: {
    gradient: 'from-purple-50 to-purple-100',
    border: 'border-purple-200',
    icon: 'bg-purple-500',
    text: 'text-purple-700',
  },
  orange: {
    gradient: 'from-orange-50 to-orange-100',
    border: 'border-orange-200',
    icon: 'bg-orange-500',
    text: 'text-orange-700',
  },
  teal: {
    gradient: 'from-teal-50 to-teal-100',
    border: 'border-teal-200',
    icon: 'bg-teal-500',
    text: 'text-teal-700',
  },
  red: {
    gradient: 'from-red-50 to-red-100',
    border: 'border-red-200',
    icon: 'bg-red-500',
    text: 'text-red-700',
  },
};

export function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={`bg-gradient-to-br ${colors.gradient} rounded-lg p-4 border ${colors.border}`}
    >
      <div className="flex items-center gap-3">
        <div className={`${colors.icon} rounded-full p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
