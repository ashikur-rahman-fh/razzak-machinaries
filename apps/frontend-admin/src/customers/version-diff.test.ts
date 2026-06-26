import { describe, expect, it } from 'vitest';

import type { CustomerVersion } from '@razzak-machinaries/shared/api';

import { getCustomerVersionChanges } from './version-diff';

function buildVersion(overrides: Partial<CustomerVersion> = {}): CustomerVersion {
  return {
    id: 1,
    versionNumber: 1,
    isCurrent: true,
    previousVersionId: null,
    fullNameBn: 'রহিম',
    fullNameEn: 'Rahim',
    addressBn: 'ঠিকানা',
    addressEn: 'Address',
    phoneBn: '০১৭১',
    phoneEn: '0171',
    fatherNameBn: 'করিম',
    fatherNameEn: 'Karim',
    memoPageNumberBn: '১',
    memoPageNumberEn: '1',
    mediatorNameBn: '',
    mediatorNameEn: '',
    profilePictureUrl: null,
    changeReason: '',
    createdByName: 'admin',
    createdAt: '2026-06-24T10:00:00Z',
    ...overrides,
  };
}

describe('getCustomerVersionChanges', () => {
  it('returns no changes when snapshots match', () => {
    const version = buildVersion();
    expect(getCustomerVersionChanges(version, { ...version, id: 2 })).toEqual([]);
  });

  it('detects changed bilingual name fields', () => {
    const previous = buildVersion();
    const current = buildVersion({
      id: 2,
      fullNameBn: 'আলী',
      fullNameEn: 'Ali',
    });

    const changes = getCustomerVersionChanges(previous, current);
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          labelKey: 'customer.field.fullName',
          from: 'রহিম',
          to: 'আলী',
          isBanglaFrom: true,
          isBanglaTo: true,
        }),
        expect.objectContaining({
          labelKey: 'customer.field.fullName',
          from: 'Rahim',
          to: 'Ali',
        }),
      ]),
    );
  });

  it('detects profile picture upload and removal', () => {
    const previous = buildVersion();
    const uploaded = buildVersion({
      id: 2,
      profilePictureUrl: 'https://example.test/photo.jpg',
    });
    const removed = buildVersion({ id: 3, profilePictureUrl: null });

    expect(getCustomerVersionChanges(previous, uploaded)).toEqual([
      expect.objectContaining({
        labelKey: 'customer.history.profilePicture.label',
        from: '—',
        to: 'Photo uploaded',
      }),
    ]);

    expect(getCustomerVersionChanges(uploaded, removed)).toEqual([
      expect.objectContaining({
        labelKey: 'customer.history.profilePicture.label',
        from: 'Photo uploaded',
        to: 'Photo removed',
      }),
    ]);
  });
});
