"use client";

import clsx from 'clsx';

import { getReadableTextColor } from '@/utils/colors';

interface UserBadgeProps {
  name: string;
  color: string;
  className?: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ name, color, className }) => {
  const textColor = getReadableTextColor(color);

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium shadow-sm ring-1 ring-black/5',
        className,
      )}
      style={{ backgroundColor: color, color: textColor }}
    >
      <span className="size-2 rounded-full bg-white/60 shadow-inner" />
      {name}
    </span>
  );
};
