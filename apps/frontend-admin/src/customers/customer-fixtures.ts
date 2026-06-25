import type { Customer } from '@razzak-machinaries/shared/api';

export const sampleCustomer: Customer = {
  id: 42,
  fullNameBn: 'রহিম উদ্দিন',
  fullNameEn: 'Rahim Uddin',
  addressBn: 'গ্রাম: চরপাড়া, ঢাকা',
  addressEn: 'Village: Charpara, Dhaka',
  phoneBn: '০১৭১২৩৪৫৬৭৮',
  phoneEn: '01712345678',
  phone: '+8801712345678',
  fatherNameBn: 'করিম উদ্দিন',
  fatherNameEn: 'Karim Uddin',
  memoPageNumberBn: '১২৩',
  memoPageNumberEn: '123',
  mediatorNameBn: 'মাধ্যম আলী',
  mediatorNameEn: 'Mediator Ali',
  profilePictureUrl: null,
  cachedBalance: '0.00',
  createdAt: '2026-06-24T10:00:00Z',
  updatedAt: '2026-06-24T10:00:00Z',
};

export function paginatedCustomers<T>(results: T[], count = results.length) {
  return {
    count,
    next: null,
    previous: null,
    results,
  };
}
