import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'fever' | 'success' | 'warning' | 'info' | 'neutral' | 'critical';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let variantClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (variant) {
    case 'fever':
    case 'critical':
      variantClasses = 'bg-red-50 text-red-700 border-red-200 font-medium';
      break;
    case 'success':
      variantClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
      break;
    case 'warning':
      variantClasses = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
      break;
    case 'info':
      variantClasses = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
