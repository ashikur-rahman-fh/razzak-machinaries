'use client';

import { LoadingState } from '@razzak-machinaries/shared/ui';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { ADMIN_AUTH_COPY } from './messages';
import { useAdminAuth } from './AdminAuthProvider';

function AuthLoadingShell({ label = ADMIN_AUTH_COPY.checkingSession }: { label?: string }) {
  return <LoadingState layout="fullscreen" label={label} data-testid="admin-auth-loading" />;
}

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <AuthLoadingShell label={ADMIN_AUTH_COPY.checkingSession} />;
  }

  if (!isAuthenticated) {
    return <AuthLoadingShell label={ADMIN_AUTH_COPY.redirectingToSignIn} />;
  }

  return <>{children}</>;
}

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (!isLoading && isAuthenticated) {
    return <AuthLoadingShell label={ADMIN_AUTH_COPY.redirecting} />;
  }

  return <>{children}</>;
}
