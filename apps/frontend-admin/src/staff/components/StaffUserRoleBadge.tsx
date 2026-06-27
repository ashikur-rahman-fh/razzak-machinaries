'use client';

import { Badge, TranslatedText } from '@razzak-machinaries/shared/ui';

export function StaffUserRoleBadge({ isSuperuser }: { isSuperuser: boolean }) {
  return (
    <Badge variant={isSuperuser ? 'default' : 'secondary'} data-testid="staff-role-badge">
      <TranslatedText
        translationKey={isSuperuser ? 'staff.role.superuser' : 'staff.role.staff'}
        as="span"
        compact
      />
    </Badge>
  );
}
