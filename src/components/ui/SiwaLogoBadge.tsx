import React from 'react';

interface SiwaLogoBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<SiwaLogoBadgeProps['size']>, string> = {
  xs: 'w-8 h-8',
  sm: 'w-9 h-9',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export default function SiwaLogoBadge({
  size = 'md',
  className = '',
}: SiwaLogoBadgeProps) {
  return (
    <img
      src="/icons/siwa-logo.svg"
      alt="Logo SIWA"
      className={`${SIZE_CLASS[size]} shrink-0 select-none drop-shadow-sm ${className}`}
    />
  );
}
