import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  href?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  href,
  className
}: StatsCardProps) {
  const content = (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-xs p-6 hover:shadow-md transition-all duration-200',
        href && 'cursor-pointer hover:border-blue-200',
        className
      )}
    >
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
            {title}
          </p>
          <p className='text-3xl font-bold text-gray-900 mt-2'>{value}</p>
          {trend && (
            <div className='flex items-center mt-2'>
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-md',
                  trend.value > 0
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                +{trend.value}
              </span>
              <span className='text-xs text-gray-400 ml-1.5'>{trend.label}</span>
            </div>
          )}
        </div>
        <div className='w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-xs'>
          <Icon className='h-6 w-6' />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
