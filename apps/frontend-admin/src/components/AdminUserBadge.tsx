'use client';

import { useTranslation } from '@razzak-machinaries/shared/i18n';
import { cn } from '@razzak-machinaries/shared/ui';
import Link from 'next/link';

import { formatAdminDisplayName, getAdminInitials } from '@/auth/admin-user-display';

type AdminUserBadgeProps = {
  firstName: string;
  lastName: string;
  username?: string;
  className?: string;
  onNavigate?: () => void;
};

export function AdminUserBadge({
  firstName,
  lastName,
  username,
  className,
  onNavigate,
}: AdminUserBadgeProps) {
  const { t } = useTranslation();
  const displayName = formatAdminDisplayName(firstName, lastName, username);
  const initials = getAdminInitials(firstName, lastName);

  return (
    <Link
      href="/profile"
      onClick={onNavigate}
      className={cn(
        'flex w-full min-w-0 items-center justify-center gap-2.5 rounded-md px-2 py-1.5 transition-colors',
        'hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
      aria-label={`${t('nav.profile')}: ${displayName}`}
      data-testid="admin-user-badge"
    >
      <div
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-soft ring-1 ring-primary/20"
      >
        {initials}
      </div>
      <p className="min-w-0 truncate font-display text-sm font-semibold tracking-tight text-accent">
        {displayName}
      </p>
    </Link>
  );
}
