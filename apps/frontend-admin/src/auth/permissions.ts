import type { AdminUser } from '@razzak-machinaries/shared/api';

import { useAdminAuth } from './AdminAuthProvider';

export function canAccessEditHistory(user: AdminUser | null): boolean {
  return user?.isSuperuser === true;
}

export function canManageStaffUsers(user: AdminUser | null): boolean {
  return user?.isSuperuser === true;
}

export function useCanAccessEditHistory(): boolean {
  const { user } = useAdminAuth();
  return canAccessEditHistory(user);
}

export function useCanManageStaffUsers(): boolean {
  const { user } = useAdminAuth();
  return canManageStaffUsers(user);
}
