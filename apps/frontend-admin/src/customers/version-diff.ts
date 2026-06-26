import type { CustomerVersion } from '@razzak-machinaries/shared/api';

import type { FieldChange } from '@/components/version-change-types';

type ProfilePictureChangeLabels = {
  none: string;
  uploaded: string;
  removed: string;
  changed: string;
};

const PROFILE_PICTURE_LABELS: ProfilePictureChangeLabels = {
  none: '—',
  uploaded: 'Photo uploaded',
  removed: 'Photo removed',
  changed: 'Photo changed',
};

type ComparableField = {
  labelKey: string;
  getValue: (version: CustomerVersion) => string;
  isBangla?: boolean;
};

const COMPARABLE_FIELDS: ComparableField[] = [
  {
    labelKey: 'customer.field.fullName',
    getValue: (version) => version.fullNameBn,
    isBangla: true,
  },
  {
    labelKey: 'customer.field.fullName',
    getValue: (version) => version.fullNameEn,
  },
  {
    labelKey: 'customer.field.address',
    getValue: (version) => version.addressBn,
    isBangla: true,
  },
  {
    labelKey: 'customer.field.address',
    getValue: (version) => version.addressEn,
  },
  {
    labelKey: 'customer.field.phone',
    getValue: (version) => version.phoneBn,
    isBangla: true,
  },
  {
    labelKey: 'customer.field.phone',
    getValue: (version) => version.phoneEn,
  },
  {
    labelKey: 'customer.field.fatherName',
    getValue: (version) => version.fatherNameBn,
    isBangla: true,
  },
  {
    labelKey: 'customer.field.fatherName',
    getValue: (version) => version.fatherNameEn,
  },
  {
    labelKey: 'customer.field.memoPageNumber',
    getValue: (version) => version.memoPageNumberBn,
    isBangla: true,
  },
  {
    labelKey: 'customer.field.memoPageNumber',
    getValue: (version) => version.memoPageNumberEn,
  },
  {
    labelKey: 'customer.field.mediatorName',
    getValue: (version) => version.mediatorNameBn,
    isBangla: true,
  },
  {
    labelKey: 'customer.field.mediatorName',
    getValue: (version) => version.mediatorNameEn,
  },
];

function formatProfilePictureValue(url: string | null, labels: ProfilePictureChangeLabels): string {
  return url ? labels.uploaded : labels.none;
}

function getProfilePictureChange(
  previous: CustomerVersion,
  current: CustomerVersion,
  labels: ProfilePictureChangeLabels = PROFILE_PICTURE_LABELS,
): FieldChange | null {
  const previousUrl = previous.profilePictureUrl;
  const currentUrl = current.profilePictureUrl;

  if (previousUrl === currentUrl) {
    return null;
  }

  if (!previousUrl && currentUrl) {
    return {
      labelKey: 'customer.history.profilePicture.label',
      from: labels.none,
      to: labels.uploaded,
    };
  }

  if (previousUrl && !currentUrl) {
    return {
      labelKey: 'customer.history.profilePicture.label',
      from: labels.uploaded,
      to: labels.removed,
    };
  }

  return {
    labelKey: 'customer.history.profilePicture.label',
    from: formatProfilePictureValue(previousUrl, labels),
    to: labels.changed,
  };
}

export function getCustomerVersionChanges(
  previous: CustomerVersion,
  current: CustomerVersion,
): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const field of COMPARABLE_FIELDS) {
    const from = field.getValue(previous);
    const to = field.getValue(current);
    if (from !== to) {
      changes.push({
        labelKey: field.labelKey,
        from,
        to,
        isBanglaFrom: field.isBangla,
        isBanglaTo: field.isBangla,
      });
    }
  }

  const profilePictureChange = getProfilePictureChange(previous, current);
  if (profilePictureChange) {
    changes.push(profilePictureChange);
  }

  return changes;
}

export function findCustomerVersionById(
  versions: CustomerVersion[],
  versionId: number,
): CustomerVersion | undefined {
  return versions.find((version) => version.id === versionId);
}

export function findPreviousCustomerVersion(
  versions: CustomerVersion[],
  version: CustomerVersion,
): CustomerVersion | undefined {
  if (version.previousVersionId == null) {
    return undefined;
  }
  return findCustomerVersionById(versions, version.previousVersionId);
}
