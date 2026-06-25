'use client';

import { cn } from '@razzak-machinaries/shared/ui';
import Image from 'next/image';

import { getCustomerInitials } from '../utils';

type CustomerAvatarProps = {
  fullNameBn: string;
  fullNameEn: string;
  profilePictureUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'size-10 text-xs',
  md: 'size-14 text-sm',
  lg: 'size-24 text-xl',
} as const;

const imageSizes = {
  sm: 40,
  md: 56,
  lg: 96,
} as const;

export function CustomerAvatar({
  fullNameBn,
  fullNameEn,
  profilePictureUrl,
  size = 'sm',
  className,
}: CustomerAvatarProps) {
  const initials = getCustomerInitials({ fullNameBn, fullNameEn });
  const dimension = imageSizes[size];

  if (profilePictureUrl) {
    return (
      <Image
        src={profilePictureUrl}
        alt=""
        width={dimension}
        height={dimension}
        className={cn('shrink-0 rounded-full object-cover', sizeClasses[size], className)}
        unoptimized
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground',
        sizeClasses[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
