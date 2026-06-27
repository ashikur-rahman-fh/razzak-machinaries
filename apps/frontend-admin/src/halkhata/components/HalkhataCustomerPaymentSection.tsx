'use client';

import type { Customer } from '@razzak-machinaries/shared/api';
import { useCallback, useState } from 'react';

import { addRecentCustomer } from '../recent-customers';
import { HalkhataCustomerSearchBox } from './HalkhataCustomerSearchBox';
import { HalkhataRecentCustomersPanel } from './HalkhataRecentCustomersPanel';

type HalkhataCustomerPaymentSectionProps = {
  halkhataId: number;
  disabled?: boolean;
  clearSearchSignal?: number;
  onSelect: (customer: Customer) => void;
};

export function HalkhataCustomerPaymentSection({
  halkhataId,
  disabled = false,
  clearSearchSignal = 0,
  onSelect,
}: HalkhataCustomerPaymentSectionProps) {
  const [recentRefreshSignal, setRecentRefreshSignal] = useState(0);

  const handleSelect = useCallback(
    (customer: Customer) => {
      addRecentCustomer(halkhataId, customer);
      setRecentRefreshSignal((value) => value + 1);
      onSelect(customer);
    },
    [halkhataId, onSelect],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <HalkhataCustomerSearchBox
        key={clearSearchSignal}
        disabled={disabled}
        onSelect={handleSelect}
      />
      <HalkhataRecentCustomersPanel
        halkhataId={halkhataId}
        disabled={disabled}
        refreshSignal={recentRefreshSignal}
        onSelect={handleSelect}
      />
    </div>
  );
}
