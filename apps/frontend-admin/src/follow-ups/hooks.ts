import { adminFollowUpsApi } from '@razzak-machinaries/shared/api';

import { getAsyncData, isAsyncInitialLoad, useAsyncData } from '@/customers/hooks';

export function useCustomerFollowUps(customerId: number) {
  return useAsyncData(() => adminFollowUpsApi.getCustomerFollowUps(customerId), [customerId]);
}

export function useDashboardFollowUps() {
  return useAsyncData(() => adminFollowUpsApi.getDashboardFollowUps(), []);
}

export { getAsyncData, isAsyncInitialLoad };
