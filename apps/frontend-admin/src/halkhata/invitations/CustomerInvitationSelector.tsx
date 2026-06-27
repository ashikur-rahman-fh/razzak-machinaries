'use client';

import type { InvitationCustomer } from '@razzak-machinaries/shared/api';
import { useLanguagePreference } from '@razzak-machinaries/shared/i18n';
import { formatBdt } from '@razzak-machinaries/shared/utils/currency';
import {
  BilingualText,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Input,
  PaginationControls,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TranslatedText,
} from '@razzak-machinaries/shared/ui';
import { useEffect, useState } from 'react';

import { useDebouncedValue } from '../hooks';
import { INVITATION_CUSTOMER_PAGE_SIZE, type InvitationSelectionState } from './utils';

type CustomerInvitationSelectorProps = {
  customers: InvitationCustomer[];
  totalCount: number;
  page: number;
  isLoading: boolean;
  selection: InvitationSelectionState;
  totalActiveCustomers: number;
  totalDueCustomers: number;
  readOnly?: boolean;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onAddressChange: (address: string) => void;
  onMediatorChange: (mediator: string) => void;
  onSelectionChange: (selection: InvitationSelectionState) => void;
};

function isCustomerSelected(selection: InvitationSelectionState, customerId: number): boolean {
  if (selection.mode === 'all_active' || selection.mode === 'due_only') {
    return false;
  }
  return selection.ids.has(customerId);
}

function isPageFullySelected(
  selection: InvitationSelectionState,
  customers: InvitationCustomer[],
): boolean {
  if (selection.mode !== 'manual' || customers.length === 0) {
    return false;
  }
  return customers.every((customer) => selection.ids.has(customer.id));
}

export function CustomerInvitationSelector({
  customers,
  totalCount,
  page,
  isLoading,
  selection,
  totalActiveCustomers,
  totalDueCustomers,
  readOnly = false,
  onPageChange,
  onSearchChange,
  onAddressChange,
  onMediatorChange,
  onSelectionChange,
}: CustomerInvitationSelectorProps) {
  const { language } = useLanguagePreference();
  const [searchInput, setSearchInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [mediatorInput, setMediatorInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const debouncedAddress = useDebouncedValue(addressInput, 300);
  const debouncedMediator = useDebouncedValue(mediatorInput, 300);

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  useEffect(() => {
    onAddressChange(debouncedAddress);
  }, [debouncedAddress, onAddressChange]);

  useEffect(() => {
    onMediatorChange(debouncedMediator);
  }, [debouncedMediator, onMediatorChange]);

  function toggleCustomer(customerId: number) {
    if (readOnly || selection.mode !== 'manual') {
      onSelectionChange({ mode: 'manual', ids: new Set([customerId]) });
      return;
    }
    const nextIds = new Set(selection.ids);
    if (nextIds.has(customerId)) {
      nextIds.delete(customerId);
    } else {
      nextIds.add(customerId);
    }
    onSelectionChange({ mode: 'manual', ids: nextIds });
  }

  function togglePageSelection() {
    if (readOnly) return;
    const nextIds = selection.mode === 'manual' ? new Set(selection.ids) : new Set<number>();
    const allSelected = isPageFullySelected({ mode: 'manual', ids: nextIds }, customers);
    if (allSelected) {
      for (const customer of customers) {
        nextIds.delete(customer.id);
      }
    } else {
      for (const customer of customers) {
        nextIds.add(customer.id);
      }
    }
    onSelectionChange({ mode: 'manual', ids: nextIds });
  }

  const pageFullySelected =
    selection.mode === 'manual' && isPageFullySelected(selection, customers);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <TranslatedText
          translationKey="halkhata.invitations.selectorTitle"
          as="div"
          className="text-lg font-semibold"
        />
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={language === 'bn' ? 'নাম, ফোন, ঠিকানা…' : 'Name, phone, address…'}
            disabled={readOnly}
            aria-label={language === 'bn' ? 'গ্রাহক খুঁজুন' : 'Search customers'}
          />
          <Input
            value={addressInput}
            onChange={(event) => setAddressInput(event.target.value)}
            placeholder={language === 'bn' ? 'ঠিকানা / গ্রাম' : 'Address / village'}
            disabled={readOnly}
            aria-label={language === 'bn' ? 'ঠিকানা ফিল্টার' : 'Filter by address'}
          />
          <Input
            value={mediatorInput}
            onChange={(event) => setMediatorInput(event.target.value)}
            placeholder={language === 'bn' ? 'মধ্যস্থতাকারী' : 'Mediator'}
            disabled={readOnly}
            aria-label={language === 'bn' ? 'মধ্যস্থতাকারী ফিল্টার' : 'Filter by mediator'}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={readOnly}
            onClick={togglePageSelection}
          >
            <TranslatedText translationKey="halkhata.invitations.selectPage" as="span" compact />
          </Button>
          <Button
            type="button"
            variant={selection.mode === 'all_active' ? 'default' : 'outline'}
            size="sm"
            disabled={readOnly || totalActiveCustomers === 0}
            onClick={() => onSelectionChange({ mode: 'all_active' })}
          >
            <TranslatedText translationKey="halkhata.invitations.selectAll" as="span" compact /> (
            {totalActiveCustomers})
          </Button>
          <Button
            type="button"
            variant={selection.mode === 'due_only' ? 'default' : 'outline'}
            size="sm"
            disabled={readOnly || totalDueCustomers === 0}
            onClick={() => onSelectionChange({ mode: 'due_only' })}
          >
            <TranslatedText translationKey="halkhata.invitations.selectDue" as="span" compact /> (
            {totalDueCustomers})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={readOnly}
            onClick={() => onSelectionChange({ mode: 'manual', ids: new Set() })}
          >
            <TranslatedText
              translationKey="halkhata.invitations.clearSelection"
              as="span"
              compact
            />
          </Button>
        </div>
        {selection.mode !== 'manual' ? (
          <p className="text-sm text-muted-foreground">
            <TranslatedText
              translationKey="halkhata.invitations.bulkModeActive"
              as="span"
              compact
            />
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : customers.length === 0 ? (
          <EmptyState
            title={
              <TranslatedText translationKey="halkhata.invitations.customersEmpty" as="span" />
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="size-4 rounded border border-input"
                      checked={pageFullySelected}
                      disabled={readOnly || selection.mode !== 'manual'}
                      onChange={togglePageSelection}
                      aria-label={
                        language === 'bn' ? 'এই পৃষ্ঠার সব নির্বাচন' : 'Select all on this page'
                      }
                    />
                  </TableHead>
                  <TableHead>
                    <TranslatedText
                      translationKey="halkhata.invitations.column.name"
                      as="span"
                      compact
                    />
                  </TableHead>
                  <TableHead>
                    <TranslatedText
                      translationKey="halkhata.invitations.column.phone"
                      as="span"
                      compact
                    />
                  </TableHead>
                  <TableHead>
                    <TranslatedText
                      translationKey="halkhata.invitations.column.address"
                      as="span"
                      compact
                    />
                  </TableHead>
                  <TableHead>
                    <TranslatedText
                      translationKey="halkhata.invitations.column.father"
                      as="span"
                      compact
                    />
                  </TableHead>
                  <TableHead>
                    <TranslatedText
                      translationKey="halkhata.invitations.column.due"
                      as="span"
                      compact
                    />
                  </TableHead>
                  <TableHead>
                    <TranslatedText
                      translationKey="halkhata.invitations.column.memo"
                      as="span"
                      compact
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => {
                  const checked =
                    selection.mode === 'all_active' ||
                    selection.mode === 'due_only' ||
                    isCustomerSelected(selection, customer.id);
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="size-4 rounded border border-input"
                          checked={checked}
                          disabled={
                            readOnly ||
                            selection.mode === 'all_active' ||
                            selection.mode === 'due_only'
                          }
                          onChange={() => toggleCustomer(customer.id)}
                          aria-label={`${customer.fullNameEn || customer.fullNameBn}`}
                        />
                      </TableCell>
                      <TableCell>
                        <BilingualText bn={customer.fullNameBn} en={customer.fullNameEn} />
                      </TableCell>
                      <TableCell>
                        {customer.phoneBn || customer.phoneEn || customer.phone}
                      </TableCell>
                      <TableCell>
                        <BilingualText
                          bn={customer.addressBn}
                          en={customer.addressEn}
                          layout="compact"
                        />
                      </TableCell>
                      <TableCell>
                        <BilingualText
                          bn={customer.fatherNameBn}
                          en={customer.fatherNameEn}
                          layout="compact"
                        />
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatBdt(customer.cachedBalance, language)}
                      </TableCell>
                      <TableCell>
                        <BilingualText
                          bn={customer.memoPageNumberBn}
                          en={customer.memoPageNumberEn}
                          layout="compact"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <PaginationControls
          page={page}
          pageSize={INVITATION_CUSTOMER_PAGE_SIZE}
          totalCount={totalCount}
          onPageChange={onPageChange}
          summaryLabel={
            language === 'bn'
              ? `${totalCount} জনের মধ্যে ${(page - 1) * INVITATION_CUSTOMER_PAGE_SIZE + 1}–${Math.min(page * INVITATION_CUSTOMER_PAGE_SIZE, totalCount)}`
              : `${(page - 1) * INVITATION_CUSTOMER_PAGE_SIZE + 1}–${Math.min(page * INVITATION_CUSTOMER_PAGE_SIZE, totalCount)} of ${totalCount}`
          }
          previousLabel={language === 'bn' ? 'আগের' : 'Previous'}
          nextLabel={language === 'bn' ? 'পরের' : 'Next'}
        />
      </CardContent>
    </Card>
  );
}
