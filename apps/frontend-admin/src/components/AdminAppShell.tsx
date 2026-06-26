'use client';

import type { ReactNode } from 'react';

import { AdminSidebarLayout, type AdminActiveRoute } from './AdminSidebar';

export type AdminAppShellProps = {
  activeRoute: AdminActiveRoute;
  children: ReactNode;
  onLogout?: () => void;
  isLoggingOut?: boolean;
  contentClassName?: string;
  'data-testid'?: string;
};

export function AdminAppShell({
  activeRoute,
  children,
  onLogout,
  isLoggingOut = false,
  contentClassName,
  'data-testid': dataTestId,
}: AdminAppShellProps) {
  return (
    <AdminSidebarLayout
      activeRoute={activeRoute}
      onLogout={onLogout}
      isLoggingOut={isLoggingOut}
      contentClassName={contentClassName}
      data-testid={dataTestId}
    >
      {children}
    </AdminSidebarLayout>
  );
}
