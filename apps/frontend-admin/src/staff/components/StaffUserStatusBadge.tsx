'use client';

import { Badge, TranslatedText } from '@razzak-machinaries/shared/ui';

export function StaffUserStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? 'success' : 'outline'} data-testid="staff-status-badge">
      <TranslatedText
        translationKey={isActive ? 'staff.status.active' : 'staff.status.inactive'}
        as="span"
        compact
      />
    </Badge>
  );
}
